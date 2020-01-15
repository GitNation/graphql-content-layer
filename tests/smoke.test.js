import { getContent } from '../src';
import settings from './jsnation.conference-settings';

describe('JsNation', () => {
  it('should generate content', async () => {
    expect(async () => {
      await getContent(settings);
    }).not.toThrow();
  });
});
