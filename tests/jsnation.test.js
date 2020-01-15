import { getContent } from '../src';
import settings from './jsnation.conference-settings'

describe('JsNation', () => {
  it('should render content', async () => {
    const content = await getContent(settings);

    expect(content).toMatchSnapshot();
  });
});
