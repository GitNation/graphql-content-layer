import { getSettings } from '../develop/conference-settings';
import { getContent } from '../src';
import { createReport } from '../utils/content-report';

describe('RS', () => {
  const settings = getSettings();

  it.each([
    'pages',
    'conference',
    'speakers',
    'sponsors',
    'schedule',
    'tracks',
    'talks',
    'workshops',
    'otherContent',
  ])('should prepare %s', async contentSection => {
    const content = await getContent(settings.rs);
    const report = createReport(content);
    expect(report[contentSection]).toMatchSnapshot();
  });
});
