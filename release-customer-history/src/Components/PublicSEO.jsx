import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { BASE, pages, graph } from '../data/publicSeo';
export default function PublicSEO(){
 const {pathname}=useLocation();const path=pathname==='/'?'/':pathname.replace(/\/$/,'');const page=pages[path];
 if(!page)return <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>;
 return <Helmet><title>{page.title}</title><meta name="description" content={page.description}/><meta name="robots" content="index, follow, max-image-preview:large"/><link rel="canonical" href={BASE+path}/><meta property="og:title" content={page.title}/><meta property="og:description" content={page.description}/><meta property="og:url" content={BASE+path}/><meta property="og:type" content="website"/><meta property="og:image" content={BASE+'/og-thumb.png'}/><meta property="og:locale" content="en_US"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content={page.title}/><meta name="twitter:description" content={page.description}/><meta name="twitter:image" content={BASE+'/og-thumb.png'}/><script type="application/ld+json">{JSON.stringify(graph(path)).replace(/</g,'\\u003c')}</script></Helmet>;
}
