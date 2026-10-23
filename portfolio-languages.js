/* Shared portfolio language controls. Keeps original text for lossless switching. */
(()=>{'use strict';
const translations={"Instructional & learning designer":["Diseñador instruccional y del aprendizaje","教学与学习设计师"],"Home":["Inicio","首页"],"Portfolio menu":["Menú del portafolio","作品集菜单"],"Explore the portfolio":["Explorar el portafolio","探索作品集"],"See the work":["Ver el trabajo","查看作品"],"My approach":["Mi enfoque","我的方法"],"Question":["Preguntar","提出问题"],"Design":["Diseñar","设计"],"Test and refine":["Probar y mejorar","测试与改进"],"My experience":["Mi experiencia","我的经历"],"Experience overview":["Resumen de experiencia","经历概览"],"Learning delivery":["Impartición del aprendizaje","教学实施"],"Accredited course design":["Diseño de cursos acreditados","认证课程设计"],"Audit and accountability":["Auditoría y rendición de cuentas","审计与责任"],"University institute":["Instituto universitario","大学研究所"],"Summary of my CV":["Resumen de mi CV","简历摘要"],"Explore ADDIE":["Explorar ADDIE","探索 ADDIE"],"Email me":["Escríbame","给我发邮件"],"For people hiring learning designers":["Para quienes contratan diseñadores del aprendizaje","面向招聘学习设计师的您"],"Don’t just":["No se limite a","不只是"],"read my CV.":["leer mi CV.","阅读我的简历。"],"Put my thinking":["Ponga mis ideas","让我的思考"],"to work.":["en acción.","发挥作用。"],"I’m Jonathan Pincher. I bring":["Soy Jonathan Pincher. Aporto","我是 Jonathan Pincher，拥有"],"30+ years of experience":["más de 30 años de experiencia","30 多年的经验"],"turning learner needs into clear courses, practical activities and meaningful assessment—online and blended.":["convirtiendo las necesidades del alumnado en cursos claros, actividades prácticas y evaluaciones significativas, en línea y semipresenciales.","，将学习者的需求转化为清晰的课程、实践活动和有意义的评估，涵盖在线与混合式学习。"],"what if?":["¿y si…?","如果……呢？"],"EXPLORE THE DESIGN":["EXPLORE EL DISEÑO","探索设计"],"ASK A BETTER QUESTION":["PLANTEE UNA MEJOR PREGUNTA","提出更好的问题"],"TRY THE EXPERIENCE":["PRUEBE LA EXPERIENCIA","亲自体验"],"EXPLORE ADDIE":["EXPLORE ADDIE","探索 ADDIE"],"DESIGN THE EXPERIENCE":["DISEÑE LA EXPERIENCIA","设计体验"],"TEST AND REFINE":["PRUEBE Y MEJORE","测试与改进"],"START HERE":["EMPIECE AQUÍ","从这里开始"],"Try the learning experience. See how one investigation becomes two different learning journeys.":["Pruebe la experiencia de aprendizaje. Vea cómo una investigación se convierte en dos recorridos de aprendizaje diferentes.","尝试学习体验，看看同一项探究如何形成两条不同的学习路径。"],"Explore my approach":["Explore mi enfoque","探索我的方法"],"See how I identify the need, design the experience and test the decisions.":["Vea cómo identifico la necesidad, diseño la experiencia y pongo a prueba las decisiones.","了解我如何确定需求、设计体验并检验决策。"],"See my experience":["Vea mi experiencia","查看我的经历"],"Explore 30+ years of learning delivery, leadership and accountable programme design.":["Explore más de 30 años de experiencia en enseñanza, liderazgo y diseño responsable de programas.","了解我在教学实施、领导工作和负责任的课程设计方面 30 多年的经验。"],"Discuss a role, a learning challenge or a possible collaboration.":["Hablemos de un puesto, un reto de aprendizaje o una posible colaboración.","欢迎交流职位、学习挑战或合作机会。"],"Back to home":["Volver al inicio","返回首页"],"Return to the portfolio home page.":["Vuelva a la página de inicio del portafolio.","返回作品集首页。"],"Jonathan Pincher · Learning design grounded in delivery":["Jonathan Pincher · Diseño del aprendizaje basado en la práctica","Jonathan Pincher · 扎根实践的学习设计"],"Skip to content":["Saltar al contenido","跳到正文"],"Breadcrumb":["Ruta de navegación","面包屑导航"],"Main portfolio navigation":["Navegación principal del portafolio","作品集主导航"],"Portfolio navigation":["Navegación del portafolio","作品集导航"],"From a question to a learning experience":["De una pregunta a una experiencia de aprendizaje","从问题到学习体验"],"What if? Turn the question into a learning experience":["¿Y si…? Convierta la pregunta en una experiencia de aprendizaje","如果……呢？将问题变成学习体验"],"Explore the ADDIE framework":["Explore el marco ADDIE","探索 ADDIE 框架"],"Read how I design learning experiences":["Lea cómo diseño experiencias de aprendizaje","阅读我的学习体验设计方法"],"Read how I test and refine the work":["Lea cómo pruebo y mejoro el trabajo","阅读我的测试与改进方法"],"Put my thinking to work | Jonathan Pincher":["Ponga mis ideas en acción | Jonathan Pincher","让我的思考发挥作用 | Jonathan Pincher"],"Jonathan Pincher: instructional design, working learning experiences and evidence from 30+ years of delivery.":["Jonathan Pincher: diseño instruccional, experiencias de aprendizaje prácticas y evidencias de más de 30 años de trabajo.","Jonathan Pincher：教学设计、可操作的学习体验，以及 30 多年教学实践的证据。"]};
const normalize=s=>s.replace(/\s+/g,' ').trim();
const textRecords=[],attributeRecords=[];
const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
for(let node;node=walker.nextNode();){
 if(node.parentElement.closest('script,style,[translate="no"]'))continue;
 const key=normalize(node.nodeValue);
 if(translations[key])textRecords.push({node,original:node.nodeValue,key});
}
for(const node of document.querySelectorAll('[aria-label],[title],meta[name="description"]')){
 if(node.closest('[translate="no"]'))continue;
 for(const name of ['aria-label','title','content']){
  if(name==='content'&&!node.matches('meta[name="description"]'))continue;
  const original=node.getAttribute(name);if(original&&translations[normalize(original)])attributeRecords.push({node,name,original,key:normalize(original)});
 }
}
const originalTitle=document.title;
const supported=['en','es','zh'];
function apply(language){
 const lang=supported.includes(language)?language:'en',column=lang==='es'?0:1;
 for(const {node,original,key} of textRecords)node.nodeValue=lang==='en'?original:original.replace(/\S[\s\S]*\S|\S/,translations[key][column]);
 for(const {node,name,original,key} of attributeRecords)node.setAttribute(name,lang==='en'?original:translations[key][column]);
 document.title=lang==='en'?originalTitle:(translations[originalTitle]?.[column]||originalTitle);
 document.documentElement.lang=lang==='zh'?'zh-CN':lang;
 for(const button of document.querySelectorAll('[data-language]'))button.setAttribute('aria-pressed',String(button.dataset.language===lang));
 try{localStorage.setItem('jp-guide-language',lang);localStorage.setItem('jp-portfolio-language',lang)}catch{}
 try{const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(history.state,'',url.href)}catch{}
 document.dispatchEvent(new CustomEvent('portfolio-language-change',{detail:{language:lang}}));
}
document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>apply(button.dataset.language)));
let initial=new URL(location.href).searchParams.get('lang');
if(!supported.includes(initial)){try{initial=localStorage.getItem('jp-guide-language')||localStorage.getItem('jp-portfolio-language')}catch{}}
apply(initial||'en');
addEventListener('pageshow',()=>{try{const lang=localStorage.getItem('jp-guide-language');if(supported.includes(lang))apply(lang)}catch{}});
window.JP_PORTFOLIO_LANGUAGE={apply};
})();
