const e=(r,t="INR")=>new Intl.NumberFormat("en-IN",{style:"currency",currency:t,maximumFractionDigits:0}).format(Number(r||0));export{e as f};
