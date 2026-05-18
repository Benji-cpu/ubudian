// Import all adapters to trigger registration side effects.
//
// Paused adapters (2026-05-18, /events overhaul): high-noise sources that
// dump tourist-trap content (bar crawls, ATV tours, generic yoga drop-ins)
// faster than the LLM ICP filter and admin queue can prune them. Re-enable
// once each has a curated seed config (keyword bias, venue allow-list, or
// category filter). See `.claude/plans/the-ubudian-open-golden-music.md`.
import "./apify-instagram";
import "./bookretreats";
import "./eventbrite";
import "./facebook";
import "./instagram";
import "./megatix";
import "./retreat-guru";
import "./telegram";
import "./tickettailor";
import "./whatsapp";
import "./wordpress";
// import "./allevents";          // PAUSED — radius-only API, no text filter
// import "./meetup";              // PAUSED — pulls bar/party meetups
// import "./serpapi";              // PAUSED — generic Google scraping
// import "./scrapers/generic-scraper"; // PAUSED — until per-source seed configs land
