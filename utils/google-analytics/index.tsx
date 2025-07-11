import Script from "next/script";
import React from "react";

const token = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS;

function GoogleAnalytics() {
    if (!token) {
        return null;
    }
    return (
        <>
            <Script
                strategy="lazyOnload"
                src={`https://www.googletagmanager.com/gtag/js?id=${token}`} />
            <Script strategy="lazyOnload" id="google-analytics">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${token}');
                `}
            </Script>
        </>
    );
}

export default GoogleAnalytics;
