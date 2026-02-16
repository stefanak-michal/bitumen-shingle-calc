# bitumen-shingle-calc

Visual calculator to help you calculate how much bitumen (asphalt) shingles you need to cover your roof.

## Features

- **Interactive Configuration Panel**
  - Shingle size (default 1000×333mm)
  - Vertical overlap adjustment (default 100mm)
  - Horizontal offset for staggered pattern (default 167mm)
  - Roof area dimensions

- **Real-time Calculations**
  - Total shingles required
  - Number of rows needed
  - Average shingles per row
  - Total roof area in m²

- **2D Canvas Visualization**
  - Top-down view of the roof
  - Realistic shingle placement with overlaps
  - Staggered/offset pattern between rows
  - 3-tab shingle simulation
  - Color variations for realistic appearance
  - Scale indicator

## Usage

1. Open `index.html` in a web browser
2. Adjust the configuration values:
   - Enter your shingle dimensions (default is standard size)
   - Set the overlap and offset values
   - Input your roof dimensions
3. Click "Calculate & Visualize" or press Enter
4. View the results and visual representation

## Technology

- Pure frontend application (no backend required)
- HTML5 Canvas for visualization
- Vanilla JavaScript (no dependencies)
- Responsive CSS design

## Installation

No installation required! Simply open `index.html` in any modern web browser.

Alternatively, you can serve it with any HTTP server:
```bash
# Using Python
python3 -m http.server 8080

# Using Node.js
npx http-server
```

Then navigate to `http://localhost:8080` in your browser.

## License

See LICENSE file for details.
