import ReactMarkdown from 'react-markdown';

const JobDescriptionContent = ({ children = '', className = '' }) => (
  <div className={`text-[15px] leading-8 text-slate-600 ${className}`.trim()}>
    <ReactMarkdown
      skipHtml
      components={{
        h1: ({ children: heading }) => <h2 className="mb-4 mt-7 text-2xl font-black leading-tight text-navy first:mt-0">{heading}</h2>,
        h2: ({ children: heading }) => <h3 className="mb-3 mt-7 text-xl font-black leading-tight text-navy first:mt-0">{heading}</h3>,
        h3: ({ children: heading }) => <h4 className="mb-2 mt-6 text-base font-black text-navy first:mt-0">{heading}</h4>,
        p: ({ children: paragraph }) => <p className="mb-4 last:mb-0">{paragraph}</p>,
        ul: ({ children: list }) => <ul className="mb-5 list-disc space-y-2 pl-5 marker:text-brand-600">{list}</ul>,
        ol: ({ children: list }) => <ol className="mb-5 list-decimal space-y-2 pl-5">{list}</ol>,
        li: ({ children: item }) => <li className="pl-1 marker:text-brand-600">{item}</li>,
        strong: ({ children: strong }) => <strong className="font-black text-slate-800">{strong}</strong>,
        a: ({ children: link, href }) => (
          <a href={href} target="_blank" rel="noreferrer" className="font-bold text-brand-700 underline decoration-brand-300 underline-offset-4">
            {link}
          </a>
        )
      }}
    >
      {String(children || '')}
    </ReactMarkdown>
  </div>
);

export default JobDescriptionContent;
