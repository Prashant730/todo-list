# 🚀 Deployment Checklist & Guide

## Pre-Deployment Checklist

### ✅ Security

- [ ] Remove all hardcoded API keys from source code
- [ ] Set up environment variables for all sensitive data
- [ ] Add `.env*` files to `.gitignore`
- [ ] Verify no secrets in git history
- [ ] Test with production API key

### ✅ Code Quality

- [ ] Run ESLint: `npm run lint`
- [ ] Fix all linting warnings/errors
- [ ] Test all features manually
- [ ] Verify error handling works
- [ ] Check browser console for errors

### ✅ Performance

- [ ] Test with large task lists (100+ tasks)
- [ ] Verify app loads quickly
- [ ] Check bundle size: `npm run build`
- [ ] Test on slow network connections
- [ ] Verify mobile responsiveness

### ✅ Browser Compatibility

- [ ] Test in Chrome (latest)
- [ ] Test in Firefox (latest)
- [ ] Test in Safari (latest)
- [ ] Test in Edge (latest)
- [ ] Test on mobile devices

### ✅ Functionality

- [ ] Task CRUD operations work
- [ ] AI features respond correctly
- [ ] Export/Import functions
- [ ] Keyboard shortcuts work
- [ ] Theme switching works
- [ ] Data persists after refresh

## Deployment Platforms

### 🔷 Vercel (Recommended)

**Pros**: Easy setup, automatic deployments, great performance
**Cons**: Limited build time on free tier

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login and deploy
vercel login
vercel

# 3. Set environment variables in Vercel dashboard
# VITE_GEMINI_API_KEY=your_production_api_key
```

**Environment Variables Setup**:

1. Go to Vercel dashboard → Project → Settings → Environment Variables
2. Add: `VITE_GEMINI_API_KEY` = `your_production_api_key`
3. Redeploy: `vercel --prod`

### 🟢 Netlify

**Pros**: Great free tier, easy drag-and-drop deployment
**Cons**: Slightly slower builds

```bash
# 1. Build locally
npm run build

# 2. Deploy via Netlify CLI
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist

# Or drag-and-drop dist/ folder to netlify.com
```

**Environment Variables Setup**:

1. Netlify dashboard → Site → Environment variables
2. Add: `VITE_GEMINI_API_KEY` = `your_production_api_key`
3. Rebuild and deploy

### 🔴 GitHub Pages

**Pros**: Free, integrated with GitHub
**Cons**: Static hosting only, manual setup needed

```bash
# 1. Install gh-pages
npm install --save-dev gh-pages

# 2. Add to package.json scripts:
"homepage": "https://yourusername.github.io/todo-app",
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"

# 3. Deploy
npm run deploy
```

### 🐳 Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run
docker build -t todo-app .
docker run -p 80:80 todo-app
```

## Environment Configuration

### Development (.env.local)

```env
VITE_GEMINI_API_KEY=your_dev_api_key
VITE_APP_NAME=Todo App (Dev)
VITE_STORAGE_KEY=todo-app-dev
```

### Production (.env.production)

```env
VITE_GEMINI_API_KEY=your_prod_api_key
VITE_APP_NAME=Advanced Todo App
VITE_STORAGE_KEY=todo-app-prod
```

## Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist
```

### Optimization Tips

1. **Lazy Loading**: Implement for heavy components
2. **Code Splitting**: Split by routes/features
3. **Image Optimization**: Compress images
4. **Caching**: Set proper cache headers
5. **CDN**: Use CDN for static assets

## Monitoring & Analytics

### Error Tracking

Consider adding:

- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for usage stats

### Performance Monitoring

- Lighthouse CI for performance checks
- Web Vitals monitoring
- Bundle size tracking

## Security Headers

Add these headers to your hosting platform:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## Backup & Recovery

### Data Backup

- Users can export their data via the app
- Consider automated backup for critical deployments
- Document data recovery procedures

### Rollback Plan

1. Keep previous deployment available
2. Test rollback procedure
3. Document rollback steps
4. Monitor after rollback

## Post-Deployment

### ✅ Verification Steps

- [ ] App loads correctly
- [ ] All features work as expected
- [ ] AI integration functions properly
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Mobile experience is good

### ✅ Monitoring Setup

- [ ] Set up error tracking
- [ ] Monitor API usage/costs
- [ ] Track user engagement
- [ ] Monitor performance metrics

### ✅ Documentation

- [ ] Update README with live URL
- [ ] Document any deployment-specific configurations
- [ ] Create user guide if needed
- [ ] Set up support channels

## Troubleshooting Common Issues

### Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variable Issues

- Ensure variables start with `VITE_`
- Check spelling and case sensitivity
- Verify variables are set in deployment platform
- Restart build after adding variables

### API Key Problems

- Verify API key is valid and active
- Check API quotas and billing
- Test API key in development first
- Monitor API usage in production

### Performance Issues

- Check bundle size: should be < 1MB gzipped
- Optimize images and assets
- Implement lazy loading for heavy components
- Use browser dev tools to identify bottlenecks

## Cost Considerations

### Gemini AI API Costs

- Monitor API usage regularly
- Set up billing alerts
- Consider rate limiting for production
- Implement caching for repeated requests

### Hosting Costs

- Most static hosting is free for small apps
- Monitor bandwidth usage
- Consider CDN for global users
- Plan for scaling if needed

## Maintenance

### Regular Tasks

- [ ] Update dependencies monthly
- [ ] Monitor security vulnerabilities
- [ ] Check API usage and costs
- [ ] Review error logs
- [ ] Update documentation as needed

### Version Updates

1. Test updates in development
2. Update dependencies gradually
3. Test thoroughly before deployment
4. Keep rollback plan ready
5. Monitor after updates
