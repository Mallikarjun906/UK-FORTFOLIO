# UK RentServe - Assets & Media Guide

This folder holds all brand images, logos, icons, and downloadable resources.

## 1. Brand Logo
- **Default Dark Theme Logo**: `public/assets/images/logo.svg`
- **Light Theme Logo**: `public/assets/images/logo-light.svg`
- **To replace with your official logo**:
  1. Save your official vector logo as `logo.svg` (recommended dimensions: 420x100px or scalable SVG).
  2. For high-resolution PNG alternatives, you can save `logo.png` (840x200px @2x) and update the `src` attribute in `public/index.html` and `public/admin.html`.

## 2. BCA Brochure / Information Guide
- When you have the official BCA Internship & Project Guidance PDF brochure:
  1. Place your PDF in this folder as: `public/assets/docs/UK_RentServe_BCA_Brochure.pdf`.
  2. Link it in `index.html` using:
     ```html
     <a href="/assets/docs/UK_RentServe_BCA_Brochure.pdf" download class="btn-ghost">
       Download BCA Brochure
     </a>
     ```

## 3. Social & Favicon Media
- Favicon: `public/assets/images/favicon.svg` (or `.ico`)
- OpenGraph Share Banner: `public/assets/images/og-banner.png` (recommended size: 1200x630px)
- Kannada Typography note: Noto Sans Kannada is loaded from Google Fonts for crisp native rendering across all platforms.
