import axios from 'axios';
import { parse, Options } from 'csv-parse';
import { promisify } from 'util';
import fs from 'fs-jetpack';
import path from 'path';
import unzip from 'unzip-stream';
import { WriteStream } from 'fs';

type Data = {
  geonameid: string;
  name: string;
  asciiname: string;
  alternatenames: string | null;
  latitude: number;
  longitude: number;
  featureClass: string;
  featureCode: string;
  countryCode: string;
  cc2: string | null;
  admin1Code: string;
  admin2Code: string | null;
  admin3Code: string | null;
  admin4Code: string | null;
  population: string;
  elevation: string | null;
  dem: string | null;
  timezone: string | null;
  modificationDate: string;
};

type City = {
  name: string;
  lat: number;
  lon: number;
};

const output = './data';

export const downloadData = async () => {
  const url = 'https://download.geonames.org/export/dump/cities500.zip';
  await new Promise(async (resolve, reject) => {
    const response = await axios.get<WriteStream>(url, {
      responseType: 'stream',
    });

    response.data.pipe(unzip.Extract({ path: path.resolve(output, 'cities') }));

    response.data.on('end', () => {
      resolve(true);
    });

    response.data.on('error', (err) => {
      reject(err);
    });
  });
};

export const getCities = async () => {
  const data = await fs.readAsync(
    path.resolve(output, 'cities', 'cities500.txt'),
    'utf8',
  );
  const parseCsv = promisify<string, Options>(parse);

  if (!data) return;

  const lines = (await parseCsv(data, {
    delimiter: '\t',
    quote: '',
  })) as unknown as string[][];

  const newData: City[] = [];
  let lenCol = GEONAMES_COLUMNS.length;
  let jsonData: Data[] = [];

  for (const line of lines) {
    let lineObj: Record<string, any> = {};
    for (var i = 0; i < lenCol; i++) {
      let column = line[i] || null;
      if (
        GEONAMES_COLUMNS[i] === 'latitude' ||
        GEONAMES_COLUMNS[i] === 'longitude'
      ) {
        lineObj[GEONAMES_COLUMNS[i]] = Number(column);
      } else {
        lineObj[GEONAMES_COLUMNS[i]] = column;
      }
    }
    jsonData.push(lineObj as Data);
    newData.push({
      name: lineObj.name,
      lat: lineObj.latitude,
      lon: lineObj.longitude,
    });
  }

  await fs.writeAsync(path.resolve(output, 'cities-data.json'), jsonData);
  await fs.writeAsync(path.resolve(output, 'cities.json'), newData);
  // await fs.removeAsync(path.resolve(output, 'cities'));
};

const GEONAMES_COLUMNS = [
  'geoNameId',
  'name',
  'asciiName',
  'alternateNames',
  'latitude',
  'longitude',
  'featureClass',
  'featureCode',
  'countryCode',
  'cc2',
  'admin1Code',
  'admin2Code',
  'admin3Code',
  'admin4Code',
  'population',
  'elevation',
  'dem',
  'timezone',
  'modificationDate',
];
