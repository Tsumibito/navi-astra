export const standaloneCampaignRoutes = new Set([
  'ru/charter-for-dummies',
  'ua/charter-for-dummies',
  'ru/yahting-dlya-vseh',
]);

export const isStandaloneCampaign = (route = '') => standaloneCampaignRoutes.has(
  route.replace(/^\/+|\/+$/g, ''),
);
