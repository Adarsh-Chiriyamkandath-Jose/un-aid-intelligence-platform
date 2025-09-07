# app/services/data_loader.py
import os
import uuid
import logging
from pathlib import Path

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models import Country, Donor, Sector, AidRecord

logger = logging.getLogger(__name__)


async def load_real_aid_data(db: Session):
    """Load real UN aid data from a CSV file with memory efficiency"""
    try:
        # First clear existing data if it's sample data (< 1000 records)
        existing_count = db.query(AidRecord).count()
        if existing_count < 1000:
            logger.info(f"Clearing {existing_count} sample records...")
            db.execute(text("DELETE FROM aid_records"))
            db.commit()
        else:
            logger.info(
                f"Found {existing_count} existing records - assuming real data already loaded"
            )
            return

        # Read dataset path from env, default to gzipped small file
        csv_path = os.getenv("DATA_FILE", "./merged_data_small.csv.gz")
        p = Path(csv_path)
        if not p.exists():
            logger.warning(
                f"DATA_FILE not found at {p.resolve()} — skipping data load to avoid crash."
            )
            return

        logger.info(f"Loading real UN aid data from {csv_path}")

        processed_countries = set()
        processed_donors = set()
        processed_sectors = set()
        total_processed = 0
        total_skipped = 0
        skipped_reasons = {}
        insert_failures = []

        # Process in optimized chunks for maximum coverage
        chunk_size = 2000  # Increase chunk size for better throughput
        batch_size = 300   # Smaller batches for PostgreSQL stability

        # compression='infer' lets pandas handle .gz automatically
        for chunk_num, chunk in enumerate(
            pd.read_csv(csv_path, chunksize=chunk_size, compression="infer", low_memory=False)
        ):
            logger.info(
                f"Processing chunk {chunk_num + 1}, records processed so far: {total_processed}"
            )

            # Collect batch inserts
            countries_to_add = []
            donors_to_add = []
            sectors_to_add = []
            aid_records_to_add = []

            for _, row in chunk.iterrows():
                try:
                    # Year
                    year_value = row.get("Year", 2020)
                    year = pd.to_numeric(year_value, errors="coerce")
                    if pd.isna(year) or year is None:
                        year = 2020
                    year = int(float(year))

                    country_code = str(row.get("RecipientCode", "")).strip()
                    country_name = str(row.get("RecipientName", "")).strip().title()
                    donor_code = str(row.get("DonorCode", "")).strip()
                    donor_name = str(row.get("DonorName", "")).strip()
                    sector_code = str(row.get("SectorCode", "")).strip()
                    sector_name = str(row.get("SectorName", "")).strip()

                    # Amount: prefer disbursement, fallback to commitment
                    disbursement_value = row.get("USD_Disbursement", 0)
                    commitment_value = row.get("USD_Commitment", 0)

                    disbursement = pd.to_numeric(disbursement_value, errors="coerce")
                    commitment = pd.to_numeric(commitment_value, errors="coerce")

                    disbursement = (
                        0.0 if pd.isna(disbursement) or disbursement is None else float(disbursement)
                    )
                    commitment = (
                        0.0 if pd.isna(commitment) or commitment is None else float(commitment)
                    )
                    amount = disbursement if disbursement != 0 else commitment

                    # Validation / fixes
                    skip_reason = None
                    if not year or year < 2000 or year > 2030:
                        skip_reason = f"invalid_year_{year}"
                    elif not country_code or country_code in ("", "nan"):
                        skip_reason = "missing_country_code"
                    elif not country_name or country_name in ("", "nan"):
                        skip_reason = "missing_country_name"
                    elif not donor_code or donor_code in ("", "nan"):
                        skip_reason = "missing_donor_code"
                    elif not donor_name or donor_name in ("", "nan"):
                        skip_reason = "missing_donor_name"
                    elif not sector_code or sector_code in ("", "nan"):
                        sector_code = "99998"
                        sector_name = "Unspecified Sector"
                    elif not sector_name or sector_name in ("", "nan"):
                        sector_name = f"Sector {sector_code}"

                    if skip_reason:
                        total_skipped += 1
                        skipped_reasons[skip_reason] = skipped_reasons.get(skip_reason, 0) + 1
                        continue

                    # Country (de-dup by code)
                    if country_code not in processed_countries:
                        countries_to_add.append(
                            {
                                "id": country_code,
                                "name": country_name,
                                "iso_code": country_code[:3],
                                "region": get_region_from_country(country_name),
                                "latitude": 0.0,
                                "longitude": 0.0,
                                "population": 0,
                                "gdp_per_capita": 0.0,
                            }
                        )
                        processed_countries.add(country_code)

                    # Donor
                    if donor_code not in processed_donors:
                        donors_to_add.append(
                            {
                                "id": donor_code,
                                "name": donor_name,
                                "donor_type": get_donor_type(donor_name),
                                "country": get_donor_country(donor_name),
                                "description": f"Official development aid donor: {donor_name}",
                            }
                        )
                        processed_donors.add(donor_code)

                    # Sector
                    if sector_code not in processed_sectors:
                        sectors_to_add.append(
                            {
                                "id": sector_code,
                                "name": sector_name,
                                "code": sector_code,
                                "description": get_sector_description(sector_name),
                            }
                        )
                        processed_sectors.add(sector_code)

                    # Aid record
                    aid_records_to_add.append(
                        {
                            "id": str(uuid.uuid4()),
                            "country_id": country_code,
                            "donor_id": donor_code,
                            "sector_id": sector_code,
                            "year": year,
                            "amount": amount,
                            "currency": "USD",
                            "project_title": str(row.get("ProjectTitle", ""))[:500],
                            "description": str(row.get("LongDescription", ""))[:1000],
                        }
                    )

                    total_processed += 1

                except Exception as e:
                    total_skipped += 1
                    error_type = type(e).__name__
                    key = f"processing_error_{error_type}"
                    skipped_reasons[key] = skipped_reasons.get(key, 0) + 1
                    logger.warning(f"Error processing row {total_processed + total_skipped}: {e}")
                    continue

            # Batched inserts
            try:
                if countries_to_add:
                    for i in range(0, len(countries_to_add), batch_size):
                        batch = countries_to_add[i : i + batch_size]
                        country_objects = [Country(**data) for data in batch]
                        db.bulk_save_objects(country_objects)

                if donors_to_add:
                    for i in range(0, len(donors_to_add), batch_size):
                        batch = donors_to_add[i : i + batch_size]
                        donor_objects = [Donor(**data) for data in batch]
                        db.bulk_save_objects(donor_objects)

                if sectors_to_add:
                    for i in range(0, len(sectors_to_add), batch_size):
                        batch = sectors_to_add[i : i + batch_size]
                        sector_objects = [Sector(**data) for data in batch]
                        db.bulk_save_objects(sector_objects)

                if aid_records_to_add:
                    for i in range(0, len(aid_records_to_add), batch_size):
                        batch = aid_records_to_add[i : i + batch_size]
                        record_objects = [AidRecord(**data) for data in batch]
                        db.bulk_save_objects(record_objects)

                db.commit()
                logger.info(
                    f"Committed chunk {chunk_num + 1} - Total processed so far: {total_processed}"
                )

            except Exception as e:
                insert_failures.append(
                    {
                        "chunk": chunk_num + 1,
                        "error": str(e),
                        "countries_count": len(countries_to_add),
                        "donors_count": len(donors_to_add),
                        "sectors_count": len(sectors_to_add),
                        "records_count": len(aid_records_to_add),
                    }
                )
                logger.error(f"Error inserting chunk {chunk_num + 1}: {e}")
                db.rollback()
                continue

        # Audit report
        logger.info("DATA LOADING AUDIT REPORT:")
        logger.info(f"✓ Successfully processed: {total_processed:,} records")
        logger.info(f"✗ Skipped records: {total_skipped:,}")
        if total_processed + total_skipped > 0:
            pct = (total_processed / (total_processed + total_skipped) * 100)
            logger.info(f"📊 Processing rate: {pct:.1f}%")

        if skipped_reasons:
            logger.info("SKIP REASONS BREAKDOWN:")
            for reason, count in sorted(skipped_reasons.items(), key=lambda x: x[1], reverse=True):
                logger.info(f"  - {reason}: {count:,} records")

        if insert_failures:
            logger.info(f"INSERT FAILURES: {len(insert_failures)} chunks failed")
            for failure in insert_failures:
                logger.info(f"  - Chunk {failure['chunk']}: {failure['error']}")

        logger.info(
            f"FINAL TOTALS: {len(processed_donors)} donors, {len(processed_countries)} countries, {len(processed_sectors)} sectors"
        )

    except Exception as e:
        logger.error(f"Error loading real aid data: {e}")
        db.rollback()
        raise


def get_region_from_country(country_name: str) -> str:
    """Map country to region"""
    country = country_name.lower()
    if any(c in country for c in ["afghanistan", "pakistan", "india", "bangladesh", "nepal"]):
        return "South Asia"
    elif any(c in country for c in ["kenya", "ethiopia", "ghana", "nigeria", "tanzania"]):
        return "Sub-Saharan Africa"
    elif any(c in country for c in ["syria", "jordan", "lebanon", "iraq", "yemen"]):
        return "Middle East & North Africa"
    elif any(c in country for c in ["ukraine", "moldova", "albania"]):
        return "Europe & Central Asia"
    elif any(c in country for c in ["brazil", "colombia", "peru", "bolivia"]):
        return "Latin America & Caribbean"
    return "Other"


def get_donor_type(donor_name: str) -> str:
    """Classify donor type"""
    name = donor_name.lower()
    if any(org in name for org in ["world bank", "imf", "un", "united nations", "who", "unicef"]):
        return "multilateral"
    elif any(org in name for org in ["ngo", "foundation", "charity", "private"]):
        return "private"
    return "bilateral"


def get_donor_country(donor_name: str) -> str:
    """Map donor to country"""
    name = donor_name.lower()
    if "netherlands" in name:
        return "Netherlands"
    elif "germany" in name:
        return "Germany"
    elif any(c in name for c in ["united states", "usaid", "usa"]):
        return "United States"
    elif "canada" in name:
        return "Canada"
    elif any(c in name for c in ["uk", "britain", "dfid"]):
        return "United Kingdom"
    elif "france" in name:
        return "France"
    elif "japan" in name:
        return "Japan"
    elif "norway" in name:
        return "Norway"
    elif "sweden" in name:
        return "Sweden"
    return "International"


def get_sector_description(sector_name: str) -> str:
    """Generate sector descriptions"""
    name = sector_name.lower()
    if "health" in name:
        return "Healthcare services, medical infrastructure, disease prevention and treatment"
    elif "education" in name:
        return "Primary, secondary, and higher education programs and infrastructure"
    elif "water" in name or "sanitation" in name:
        return "Water supply systems, sanitation infrastructure, and hygiene programs"
    elif "agriculture" in name:
        return "Agricultural development, food security, and rural development programs"
    elif any(word in name for word in ["infrastructure", "transport", "energy"]):
        return "Transportation, energy, telecommunications, and infrastructure development"
    elif any(word in name for word in ["emergency", "humanitarian", "refugee"]):
        return "Emergency response, humanitarian aid, and disaster relief"
    else:
        return f"Development assistance in {sector_name.lower()}"
