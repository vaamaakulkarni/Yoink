/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['10.19.149.11'],
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones/other devices on the LAN load dev assets (JS chunks, HMR)
  // when testing against the Network URL Next.js prints on `npm run dev`.
  allowedDevOrigins: ['10.19.66.187'],
};

module.exports = nextConfig;