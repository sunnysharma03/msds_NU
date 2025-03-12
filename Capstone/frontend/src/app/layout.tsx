import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Layout from "@/app/components/Layout";
import './globals.css';
import { Suspense } from 'react'

// Import Slick Carousel Styles
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";


export const metadata: Metadata = {
  title: "SongFox",
  description: "Personalized Music Recommendation",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  
  return (
    <html lang="en">
      <head>
        {/* Global CSS (moved to <head>) */}
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/main.css" />
        <link rel="stylesheet" href="/assets/css/font-awesome.min.css" />
        <link rel="stylesheet" href="/assets/css/flexslider.css" />
        <link rel="stylesheet" href="/assets/css/owl.carousel.css" />
        <link rel="stylesheet" href="/assets/css/animations.css" />
        <link rel="stylesheet" href="/assets/css/dl-menu.css" />
        <link rel="stylesheet" href="/assets/css/jquery.datetimepicker.css" />
        <link rel="stylesheet" href="/assets/css/jquery.bxslider.css" />

        {/* Load jQuery First */}
        <Script src="/assets/js/jquery.js" strategy="beforeInteractive" />

        {/* Load Other Scripts */}
        <Script src="/assets/js/modernizr-2.6.2-respond-1.1.0.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/jquery.downCount.js" strategy="afterInteractive" />
        <Script src="/assets/js/jquery.datetimepicker.full.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/jplayer/jquery.jplayer.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/jplayer/jplayer.playlist.min.js" strategy="beforeInteractive" />
        <Script src="/assets/js/jquery.flexslider-min.js" strategy="beforeInteractive" />
        <Script src="/assets/js/jquery.stellar.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/jquery.sticky.js" strategy="afterInteractive" />
        <Script src="/assets/js/jquery.waitforimages.js" strategy="afterInteractive" />
        <Script src="/assets/js/masonry.pkgd.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/packery.pkgd.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/tweetie.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/owl.carousel.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/jquery.bxslider.min.js" strategy="afterInteractive" />

        {/* Load Main.js Last */}
        <Script src="/assets/js/main.js" strategy="afterInteractive" />
      </head>
      <body>
        <div className="majorWrap">
          <Suspense>
            <Layout>
              {children}
            </Layout>
          </Suspense>
        </div>
      </body>
    </html>
  );
}
