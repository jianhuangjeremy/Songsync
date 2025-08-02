#!/bin/bash

# Create basic colored PNG files using base64 encoded 1x1 pixel PNGs

# Green 1x1 PNG (for icon and favicon)
GREEN_PNG="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# Black 1x1 PNG (for splash)
BLACK_PNG="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA4kRBXQAAAABJRU5ErkJggg=="

# Purple 1x1 PNG (for adaptive icon)
PURPLE_PNG="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# Create the files
echo $GREEN_PNG | base64 -d > icon.png
echo $BLACK_PNG | base64 -d > splash.png
echo $PURPLE_PNG | base64 -d > adaptive-icon.png
echo $GREEN_PNG | base64 -d > favicon.png

echo "Created placeholder PNG files"
