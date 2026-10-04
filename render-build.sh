#!/usr/bin/env bash
# Render Build Script for Tenant List Updater
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "===> [1/3] Installing dependencies..."
npm install

echo "===> [2/3] Building client application with Vite..."
npm run build

echo "===> [3/3] Build completed successfully! Ready for deployment on Render."
