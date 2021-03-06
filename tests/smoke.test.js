import { getContent } from '../src';
import { getSettings } from '../develop/conference-settings';

describe('get Content', () => {
  const settings = getSettings();
  it.each(['mlconf', 'qaconf', 'doconf', 'nodeconf', 'rs', 'rsre', 'jsn'])(
    'should generate content for %s',
    async () => {
      expect(async confCode => {
        await getContent(settings[confCode]);
      }).not.toThrow();
    },
  );
});
