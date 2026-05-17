import SectionHeader from '../../../shared/components/SectionHeader';

const AdminHeader = ({ title, subtitle, action, eyebrow = '' }) => {
  return <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} action={action} />;
};

export default AdminHeader;
