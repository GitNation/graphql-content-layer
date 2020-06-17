const populateTalkActivities = content => {
  const mainSpeakers = content.speakers.main;
  const talks = content.schedule.reduce(
    (allTalks, sch) => [...allTalks, ...sch.list],

    [],
  );

  const updatedMainSpeakers = mainSpeakers.map(speaker => {
    if (!speaker.activities || !speaker.activities.talks) {
      return speaker;
    }
    const updatedTalks = speaker.activities.talks.map(tl => {
      const talkId = tl.id;
      if (!talkId) {
        return tl;
      }
      const fullTalk = talks.find(t => t.id === talkId);
      if (!fullTalk) {
        return tl;
      }
      return {
        ...fullTalk,
        ...tl,
      };
    });

    const activities = {
      ...speaker.activities,
      talks: updatedTalks,
    };

    return { ...speaker, activities };
  });

  const updatedContent = { ...content };
  updatedContent.speakers.main = updatedMainSpeakers;
  return updatedContent;
};

const mergeTalksAndQA = content => {
  const { schedule } = content;
  schedule.forEach(sch => {
    sch.list.forEach(event => {
      const { talkKey, speaker, qaLink } = event;
      if (talkKey && speaker && !qaLink) {
        const extension = sch.list.find(
          ev => ev.qaLink && ev.talkKey === talkKey,
        );
        if (extension) {
          // eslint-disable-next-line no-param-reassign
          event.extension = extension;
        }
      }
    });
  });
  return content;
};

export const postProcessLayer = content => {
  const processedContent = [mergeTalksAndQA, populateTalkActivities].reduce(
    (updatedContent, processFn) => {
      try {
        return processFn(updatedContent);
      } catch (err) {
        return updatedContent;
      }
    },
    content,
  );
  return processedContent;
};
