import { getSettings } from '../develop/conference-settings';
import { getContent } from '../src';

describe('JSN', () => {
  it('should render content', async () => {
    const settings = getSettings();
    const content = await getContent(settings.jsn);

    expect(content).toMatchSnapshot();
  });
});
