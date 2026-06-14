export const requireClientLogo = (item: string) =>
  require.context('../assets/server-db-client', false, /.*\.svg$/)(`./${item}.svg`).default;
