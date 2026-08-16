# Airbnb Host Revenue Dashboard

A dashboard prototype designed for individual Airbnb hosts who manage pricing on instinct instead of data. Built as a response to a product case study: most hosts have no visibility into how their listing performs against the local market, so they fly blind on the one decision that drives their income, the price.

**Live demo:** [add your GitHub Pages link here]

## The problem

Airbnb hosts running one or two listings as side income don't have a revenue manager's view of their business. They can't tell if a quiet week means demand dropped citywide, or if they're simply priced above the listing next door. Views don't reliably turn into bookings and there's no clear signal why. Pricing around weekends, holidays, and local events is guesswork.

## The approach

Rather than surfacing every available data point, this dashboard is built around a single defended north star metric and a diagnostic layer underneath it.

**RevPAR (Revenue per Available Night)**, calculated as occupancy times average nightly rate, is the headline number. It's the only metric on the list that equals actual income and can't be gamed by optimizing one lever (say, occupancy) while ignoring the other (rate). Occupancy alone or nightly rate alone can each look healthy while the host is still leaving money on the table.

Underneath RevPAR, the dashboard breaks out its two drivers, occupancy and nightly rate, so a host can see at a glance which one moved. Below that, a plain-language explanation connects the change to its likely cause: comp set pricing, view-to-booking conversion, or area-wide demand, rather than making the host infer it from separate charts.

The full write-up on metric selection and design rationale lives in the project's companion Notion doc.

## Features

- **RevPAR hero card** with trend line and period-over-period delta
- **Occupancy and rate breakdown** nested under the headline metric
- **Diagnostic why-panel** that explains the likely cause of a RevPAR change using a rule-based decision tree (comp set price index, conversion rate, area demand)
- **Supporting metric cards** for price position vs comp set, view-to-booking conversion, and area demand
- **Upcoming demand alert** flagging local events or holidays with a pricing call to action

## Tech stack

- React
- Tailwind CSS
- [recharts](https://recharts.org/) for the trend line
- [lucide-react](https://lucide.dev/) for icons

## Getting started

```bash
npm install
npm run dev
```

The dashboard currently runs on mock data (`MOCK_DATA` in `AirbnbHostDashboard.jsx`), swap this for a real API response to wire it to live listing data.

## Diagnostic logic

The core of this project is `buildDiagnosis()`, a rule-based function that checks which driver moved (occupancy or rate) and which underlying signal explains it (price index, conversion, or area demand), then returns the matching explanation and suggested action. Thresholds (a 5-point occupancy swing, a 10% price gap, a 4% conversion floor) are starting assumptions, not tuned against real data, and are called out as such in the project write-up.

## What's not included, and why

Cancellations and booking lead time were part of the original data set but aren't surfaced here. Both answer operational questions (listing quality, last-minute discount-driven bookings) rather than the pricing decision this dashboard is built to solve. A natural next iteration would add these, plus guest feedback, as a secondary listing-health panel.

## Background

Built as a product case study response, stepping into the shoes of an Airbnb host and designing the handful of metrics that would actually help them earn more, then building a working prototype rather than a slide deck.
