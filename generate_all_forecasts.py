#!/usr/bin/env python3
"""
Generate 2025 forecasts for all 14 countries with aid data
"""
import requests
import json

def generate_all_forecasts():
    """Generate forecasts for all 14 countries"""
    countries = [
        'India', 'Bangladesh', 'Indonesia', 'Pakistan', 'Philippines', 
        'Nigeria', 'Ethiopia', 'Kenya', 'Uzbekistan', 'Myanmar', 
        'Ghana', 'Sri Lanka', 'Nepal', 'Mongolia'
    ]
    
    base_url = "http://localhost:5000/api/forecasting/forecast"
    forecasts = {}
    
    for country in countries:
        try:
            response = requests.post(base_url, json={
                "country": country,
                "sector": "all", 
                "model": "hybrid",
                "years": 3
            })
            
            if response.status_code == 200:
                data = response.json()
                # Get 2025 prediction
                for pred in data.get('predictions', []):
                    if pred.get('year') == 2025:
                        forecasts[country] = pred.get('predicted', 0)
                        print(f"✓ {country}: ${pred.get('predicted', 0):,.0f}")
                        break
            else:
                print(f"✗ {country}: Failed ({response.status_code})")
                
        except Exception as e:
            print(f"✗ {country}: Error - {e}")
    
    print(f"\n✅ Generated forecasts for {len(forecasts)} countries")
    return forecasts

if __name__ == "__main__":
    forecasts = generate_all_forecasts()
    
    # Save to file for reference
    with open('all_forecasts_2025.json', 'w') as f:
        json.dump(forecasts, f, indent=2)