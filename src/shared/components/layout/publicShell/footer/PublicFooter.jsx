import FooterBottomBar from './FooterBottomBar';
import FooterBrand from './FooterBrand';
import FooterLinkColumn from './FooterLinkColumn';
import { footerLinkColumns } from './footerLinkColumns';

const PublicFooter = () => {
  return (
    <footer className="relative overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute left-0 top-0 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-10 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="h-1 gradient-gold" />

      <div className="container relative mx-auto max-w-6xl px-4 py-10 sm:py-11">
        <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.25fr)_repeat(4,minmax(0,0.9fr))]">
          <FooterBrand />

          {footerLinkColumns.map((column) => (
            <FooterLinkColumn key={column.title} column={column} />
          ))}
        </div>

        <FooterBottomBar />
      </div>
    </footer>
  );
};

export default PublicFooter;
