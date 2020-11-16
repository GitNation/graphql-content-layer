import { getSettings } from '../develop/conference-settings';
import { getContent } from '../src';

describe('RS', () => {
  it('should render content', async () => {
    const settings = getSettings();
    const content = await getContent(settings.rs);

    expect(content).toMatchSnapshot();
  });
});
