const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
function source(name){return fs.readFileSync(path.join(root,name),'utf8')}
function core(){const context=vm.createContext({Intl,Date,Map,Set});vm.runInContext(source('planner.js')+source('finance.js')+';globalThis.api={P,Finance};',context);return {...context.api,context}}
class Element {
 constructor(){this.children=[];this.value='';this.className='';this.dataset={};this.listeners={};this.open=false;this.checked=false;this.hidden=false;this.attrs={};this.selectionStart=0;this.selectionEnd=0}
 append(...items){this.children.push(...items)} prepend(item){this.children.unshift(item)} replaceChildren(...items){this.children=items}
 setAttribute(k,v){this.attrs[k]=v} getAttribute(k){return this.attrs[k]} addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)}
 querySelectorAll(selector){return this.children.flatMap(c=>[...(c.className?.split(' ').includes(selector.slice(1))?[c]:[]),...(c.querySelectorAll?.(selector)||[])])}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null}
 showModal(){this.open=true;this.returnValue=''} close(){this.open=false;for(const fn of this.listeners.close||[])fn();this.onclose?.()}
 reset(){} focus(){} scrollIntoView(){} setSelectionRange(start,end){this.selectionStart=start;this.selectionEnd=end} matches(){return true}click(){this.clicked=true}
}
function ui({storage=new Map(),documentName='index.html'}={}){
 const html=source(documentName).replace(/<!--[^]*?-->/g,''),elements=new Map(),messages=[],events={};let exported=null,writeFailure=false;
 for(const match of html.matchAll(/id="([^"]+)"/g))elements.set(match[1],new Element());
 const document={hidden:false,activeElement:null,getElementById:id=>elements.get(id)||null,createElement:()=>new Element(),addEventListener(k,fn){(events[k]??=[]).push(fn)}};
 const window={addEventListener(k,fn){(events[k]??=[]).push(fn)}};
 const storageAPI={getItem:k=>storage.get(k)||null,setItem(k,v){if(writeFailure)throw Error('quota');storage.set(k,v)},removeItem(k){if(writeFailure)throw Error('denied');storage.delete(k)}};
 const context=vm.createContext({document,window,Intl,Date,Map,Set,Math,crypto,Blob,URL:{createObjectURL(blob){exported=blob;return 'blob:test'},revokeObjectURL(){}},localStorage:storageAPI,toast:(message,error)=>messages.push({message,error}),confirm:()=>true,matchMedia:()=>({matches:true}),setTimeout:()=>1,clearTimeout(){}});
 for(const file of ['planner.js','finance.js','app.js','features.js','planning-tools.js','spending.js','storage-sync.js'])vm.runInContext(source(file),context,{filename:file});
 const read=code=>vm.runInContext(code,context),get=id=>{const element=elements.get(id);if(!element)throw Error('Missing '+id);return element};
 const event=()=>({preventDefault(){},stopPropagation(){}});
 return {context,elements,storage,messages,document,read,get,event,events,exported:()=>exported,failWrites:value=>writeFailure=value,fire(name,e){for(const fn of events[name]||[])fn(e)}};
}
module.exports={source,core,ui,Element,root};
