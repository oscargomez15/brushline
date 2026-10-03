import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Metrics from './Metrics';
jest.mock('netlify-identity-widget', () => ({currentUser: () => ({jwt: async () => 'token'})}));
const empty = {visitors:0,visits:0,pageviews:0,contactRate:0,contactVisitors:0,engagedVisitors:0,pages:[],sources:[],devices:[],actions:[],daily:[{day:'2026-10-03',visitors:0,pageviews:0}],hourly:Array.from({length:24},(_,hour)=>({hour,pageviews:0}))};
const result = {current:empty,previous:empty,start:'2026-09-27',end:'2026-10-03',updatedAt:'2026-10-03T15:00:00Z',observedSince:null};
test('empty metrics explain the collection start and period controls request the selected range', async () => {
  global.fetch=jest.fn().mockResolvedValue({ok:true,json:async()=>result});
  render(<Metrics/>);
  await screen.findByText('Your measurement starts here');
  expect(screen.getByText(/older visitor totals cannot be reconstructed/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Today',exact:true}));
  await waitFor(()=>expect(fetch).toHaveBeenLastCalledWith('/.netlify/functions/get-site-metrics?days=1',{headers:{Authorization:'Bearer token'}}));
  await screen.findByText('Today, hour by hour');
});
test('report failures show an error instead of invented traffic', async()=>{
  global.fetch=jest.fn().mockResolvedValue({ok:false,json:async()=>({error:'Metrics unavailable'})});
  render(<Metrics/>);
  await screen.findByRole('alert');
  expect(screen.getByText('Metrics unavailable')).toBeTruthy();
  expect(screen.queryByText('Visitor trend')).toBeNull();
});
