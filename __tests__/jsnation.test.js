import { getContent } from '../src';

describe('JsNation', () => {
  it('should render content', async () => {
    const content = await getContent();

    expect(content).toMatchSnapshot();
  });
});
