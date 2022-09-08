import { downloadData, getCities } from './cities';

const main = async () => {
  await downloadData();
  await getCities();
};

main();
