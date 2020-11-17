import { getSettings } from '../develop/conference-settings';
import { getContent } from '../src';
import { createReport } from '../utils/content-report';

describe('JSN', () => {
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
    const content = await getContent(settings.jsn);
    const report = createReport(content);
    expect(report[contentSection]).toMatchSnapshot();
  });
});
