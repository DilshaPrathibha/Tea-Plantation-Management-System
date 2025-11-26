#!/bin/bash
# Quick Deployment Script for Tea Plantation Management System

echo "🚀 Tea Plantation Management System - Deployment Helper"
echo "======================================================="

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please run this script from the project root."
    exit 1
fi

echo "📋 Pre-deployment Checklist:"
echo "1. ✅ MongoDB Atlas database ready"
echo "2. ✅ Upstash Redis configured"
echo "3. ✅ Google Gemini API key available"
echo "4. ✅ GitHub repository up to date"
echo ""

# Check if backend dependencies are installed
echo "🔍 Checking backend dependencies..."
cd BACKEND
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
else
    echo "✅ Backend dependencies already installed"
fi

cd ..

# Check if frontend dependencies are installed
echo "🔍 Checking frontend dependencies..."
cd FRONTEND
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

# Test frontend build
echo "🔨 Testing frontend build..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend builds successfully"
    rm -rf dist
else
    echo "❌ Frontend build failed. Please fix build errors before deploying."
    exit 1
fi

cd ..

echo ""
echo "✅ Pre-deployment checks completed successfully!"
echo ""
echo "🚀 Next Steps:"
echo "1. Push your code to GitHub if not already done"
echo "2. Deploy backend to Render:"
echo "   - Go to https://dashboard.render.com"
echo "   - Create new Web Service from your GitHub repo"
echo "   - Set Root Directory to 'BACKEND'"
echo "   - Configure environment variables"
echo ""
echo "3. Deploy frontend to Vercel:"
echo "   - Run: cd FRONTEND && vercel --prod"
echo "   - Or use Vercel dashboard with Root Directory 'FRONTEND'"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
echo ""
echo "🔗 Useful Commands:"
echo "Frontend deployment: cd FRONTEND && vercel --prod"
echo "Check backend health: curl https://your-render-url.onrender.com/health"
echo ""