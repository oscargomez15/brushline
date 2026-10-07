import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Reviews } from './Reviews';
import reviews from '../Components/paintingReviews.json';
test('includes at least ten real reviews and allows expanding and paging',()=>{
  expect(reviews.length).toBeGreaterThanOrEqual(10);
  expect(new Set(reviews.map(review=>review.url)).size).toBe(reviews.length);
  render(<Reviews/>);
  const expand=screen.getAllByRole('button',{name:'Read more'})[0];
  fireEvent.click(expand);
  expect(screen.getByRole('button',{name:'Show less'})).toHaveAttribute('aria-expanded','true');
  fireEvent.click(screen.getByRole('button',{name:'Next reviews'}));
  expect(screen.getByRole('status')).toHaveTextContent('2 / 6');
});
