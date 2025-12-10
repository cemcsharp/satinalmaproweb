"use client";

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import react-pdf to avoid SSR issues
const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    { ssr: false, loading: () => <span>PDF hazırlanıyor...</span> }
);

const Document = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.Document),
    { ssr: false }
);

const Page = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.Page),
    { ssr: false }
);

const Text = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.Text),
    { ssr: false }
);

const View = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.View),
    { ssr: false }
);

export { PDFDownloadLink, Document, Page, Text, View };
