const normalizeCompanies = (values = []) => {
  const seen = new Set();

  return values.reduce((companies, value) => {
    const name = String(value || '').trim();
    const key = name.toLowerCase();
    if (!name || name === '-' || seen.has(key)) return companies;
    seen.add(key);
    companies.push(name);
    return companies;
  }, []);
};

export { normalizeCompanies };
