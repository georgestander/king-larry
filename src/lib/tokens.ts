export const createInviteToken = () => {
  const raw = crypto.randomUUID().replace(/-/g, "");
  return `inv_${raw}`;
};

export const isInviteToken = (value: string) => /^inv_[a-f0-9]{32}$/i.test(value);
