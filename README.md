# Tomodachi Life Visualizer

A web-based visualization tool for Tomodachi Life save data.

## Setup

1. Extract your Tomodachi Life save data using [Tomodachi-Life-Data-Extractor](https://github.com/shantrm/Tomodachi-Life-Data-Extractor)

2. Place the `extracted_miis` folder from the extractor into this directory

3. Open `index.html` in a web browser (or use a local server like `python3 -m http.server 8000`)

## Features

- View all Miis with their images, personalities, and relationships
- Interactive relationship web (chord diagram) showing connections between all Miis
- Filter relationship types (Spouse, Lover, Best friend, etc.)
- Colors based on personality subtypes

## Files

- `index.html` - Main page
- `script.js` - Application logic
- `styles.css` - Styling
- `extracted_miis/` - Mii data folder (from Tomodachi-Life-Data-Extractor)

