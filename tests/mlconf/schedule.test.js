import { getSettings } from '../../develop/conference-settings';
import { getContent } from '../../src';
import { createReport } from '../../utils/content-report';

describe('RS', () => {
  const settings = getSettings();

  it('should be correct schedule data', async () => {
    const content = await getContent(settings.mlconf);
    const report = createReport(content);
    expect(report.schedule).toMatchSnapshot();
  });
});
