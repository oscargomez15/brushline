process.env.NODE_ENV='production';
const fs=require('fs'),path=require('path'),Module=require('module');
const React=require('react');
global.__prerenderContext=(parent,directory,recursive,pattern)=>{const root=path.resolve(path.dirname(parent),directory);const files=fs.readdirSync(root,{recursive:!!recursive}).filter(name=>pattern.test('./'+name));const context=name=>require(path.join(root,name));context.keys=()=>files.map(name=>'./'+name);return context;};
const contextPlugin=({types:t})=>({visitor:{CallExpression(p){const c=p.node.callee;if(t.isMemberExpression(c)&&t.isIdentifier(c.object,{name:'require'})&&t.isIdentifier(c.property,{name:'context'}))p.replaceWith(t.callExpression(t.memberExpression(t.identifier('global'),t.identifier('__prerenderContext')),[t.memberExpression(t.identifier('module'),t.identifier('filename')),...p.node.arguments]));}}});
require('@babel/register')({extensions:['.js','.jsx'],ignore:[/node_modules/],presets:[['@babel/preset-env',{targets:{node:'current'}}],['@babel/preset-react',{runtime:'automatic'}]],plugins:[contextPlugin],babelrc:false,configFile:false,cache:false});
for(const extension of ['.css','.jpg','.jpeg','.png','.webp','.gif','.svg','.mp4'])require.extensions[extension]=(module,file)=>{
 if(extension==='.css'){module.exports={};return;}
 const name=path.parse(file).name;
 const media=fs.readdirSync('build/static/media').find(entry=>entry.startsWith(name+'.')&&entry.endsWith(extension));
 if(!media)throw new Error('Missing built media asset: '+file);
 module.exports='/static/media/'+media;
};
const load=Module._load;
const motionTags={};
Module._load=function(name,parent,isMain){
 if(name==='framer-motion')return {motion:new Proxy({},{get:(_,tag)=>motionTags[tag] ||= React.forwardRef(({children,...props},ref)=>{for(const key of ['initial','animate','exit','transition','variants','whileInView','whileHover','whileTap','viewport','layout','custom'])delete props[key];return React.createElement(tag,{...props,ref},children);})}),AnimatePresence:({children})=>children};
 if(name==='swiper/react')return {Swiper:({children,className})=>React.createElement('div',{className},children),SwiperSlide:({children})=>React.createElement('div',null,children)};
 if(name==='swiper/modules')return {Navigation:{}};
 return load.call(this,name,parent,isMain);
};
const {renderToString}=require('react-dom/server');
const {MemoryRouter,Routes,Route}=require('react-router-dom');
const {Helmet}=require('react-helmet');
const {BASE,pages}=require('../src/data/publicSeo');
const PublicSEO=require('../src/Components/PublicSEO').default;
const {Navigation}=require('../src/Components/Navigation');const {Footer}=require('../src/Components/Footer');
const routes=[['/',require('../src/Pages/Home').Home],['/painting',require('../src/Pages/Painting').Painting],['/drywall',require('../src/Pages/Drywall').Drywall],['/cleaning',require('../src/Pages/Cleaning').Cleaning],['/privacy',require('../src/Pages/Privacy').Privacy],['/accessibility',require('../src/Pages/Accessibility').Accessibility],['/service-area/:citySlug',require('../src/Pages/ServiceArea').default],['*',require('../src/Pages/NotFound').NotFound]];
const existing=fs.readFileSync('build/index.html','utf8');
const shell=existing.includes('<div id="root"></div>')?existing:fs.readFileSync('build/spa.html','utf8').replace('<meta name="robots" content="noindex, nofollow"><title>Brushline Services</title>','');
fs.writeFileSync('build/spa.html',shell.replace('</head>','<meta name="robots" content="noindex, nofollow"><title>Brushline Services</title></head>'));
for(const url of [...Object.keys(pages),'/not-found']){
 const body=renderToString(React.createElement(MemoryRouter,{initialEntries:[url]},React.createElement('div',{className:'background-wrapper'},React.createElement(Navigation),React.createElement('main',{id:'main-content',className:'public-with-nav'},React.createElement(Routes,null,...routes.map(([path,Component])=>React.createElement(Route,{key:path,path,element:React.createElement(Component)})))),React.createElement(Footer),React.createElement(PublicSEO))));
 const head=Helmet.renderStatic();
 const html=shell.replace('</head>',head.title.toString()+head.meta.toString()+head.link.toString()+head.script.toString()+'</head>').replace('<div id="root"></div>','<div id="root">'+body+'</div>');
 const destination=url==='/'?'build/index.html':url==='/not-found'?'build/404.html':'build'+url+'.html';
 fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,html);
 if(url!=='/not-found'&&(!body.includes('<h1')||!html.includes('rel="canonical"')))throw new Error('Incomplete public page: '+url);
}
fs.writeFileSync('build/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+Object.keys(pages).map(url=>'<url><loc>'+BASE+url+'</loc></url>').join('')+'</urlset>');
console.log('Prerendered '+Object.keys(pages).length+' public pages, a private app shell, and a 404 page.');
