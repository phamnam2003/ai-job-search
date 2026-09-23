import type { PrepSet } from '../types';
import { meta } from './meta';
import { roadmap, cutList } from './roadmap';
import { topics } from './topics';
import { stars } from './stars';
import { bank } from './bank';
import { company } from './company';
import { consistency } from './consistency';

export const prep: PrepSet = {
  meta,
  topics,
  stars,
  bank,
  company,
  consistency,
  roadmap,
  cutList,
};

export { meta, roadmap, cutList, topics, stars, bank, company, consistency };
