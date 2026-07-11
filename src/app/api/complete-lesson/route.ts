    // Skip reading completedDays - use lastDay+lastWeek to detect re-completion
    const completedDays: string[] = [];
    // Simple re-completion check: if lastWeek+lastDay matches current, skip
    const lastWeekStored = (() => {
      const lpF = userDoc?.fields?.languageProgress?.mapValue?.fields;
      const lkF = lpF?.[langKey]?.mapValue?.fields;
      const pathF = lkF?.[path]?.mapValue?.fields;
      return pathF?.lastWeek?.integerValue ? parseInt(pathF.lastWeek.integerValue) : 0;
    })();
    const lastDayStored = (() => {
      const lpF = userDoc?.fields?.languageProgress?.mapValue?.fields;
      const lkF = lpF?.[langKey]?.mapValue?.fields;
      const pathF = lkF?.[path]?.mapValue?.fields;
      return pathF?.lastDay?.integerValue ? parseInt(pathF.lastDay.integerValue) : 0;
    })();
    console.log('[XP] lastWeek/lastDay stored:', lastWeekStored, lastDayStored, 'current:', week, day);

        // Already completed — don't double award XP
    if (lastWeekStored === parseInt(String(week)) && lastDayStored === parseInt(String(day))) {
      console.log('[XP] Already completed, skipping');
      return NextResponse.json({ xpPoints: currentXP, currentStreak, alreadyCompleted: true });
    }

    // Calculate new values
    const newXP = currentXP + XP_PER_LESSON;
    const isNewDay = lastActiveDate !== today;

    let newStreak = currentStreak;
    if (isNewDay) {
      if (lastActiveDate) {
        const last = new Date(lastActiveDate);
        const todayDate = new Date(today);
        const diffDays = Math.round((todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        newStreak = diffDays === 1 ? currentStreak + 1 : 1;
      } else {
        newStreak = 1;
      }
    }

    // Note: we append without reading existing array to avoid REST depth truncation
    // The client-side isDayCompleted check uses languageProgress.completedDays array
    // We write just the new entry - Firestore will merge via updateMask

    // Get existing daily XP and add to it
    const dailyXpFields = getMapField(userDoc, 'dailyXpLog');
    const existingDailyXp = dailyXpFields?.[today]?.integerValue
      ? parseInt(dailyXpFields[today].integerValue, 10)
      : 0;

    // Write all scalar fields first
    const fields: Record<string, any> = {
      xpPoints: newXP,
      currentStreak: newStreak,
      lastActiveDate: today,
      activePath: path,
      [`languageProgress.${langKey}.${path}.lastWeek`]: parseInt(String(week), 10),
      [`languageProgress.${langKey}.${path}.lastDay`]: parseInt(String(day), 10),
      [`dailyXpLog.${today}`]: existingDailyXp + XP_PER_LESSON,
    };

    const masks = [
      'xpPoints',
      'currentStreak',
      'lastActiveDate',
      'activePath',
      `languageProgress.${langKey}.${path}.lastWeek`,
      `languageProgress.${langKey}.${path}.lastDay`,
      `dailyXpLog.${today}`,
    ];

    await patchUser(token, userId, fields, masks);

    console.log('[XP] completedDays before:', JSON.stringify(completedDays), 'adding:', dayKey);
    // Append to completedDays using arrayUnion equivalent
    // Read current array first with a focused request
    const completedDaysField = `languageProgress.${langKey}.${path}.completedDays`;
    let existingDays: string[] = [];
    try {
      const cdRes = await fetch(
        `${scenarioFirestoreBaseUrl()}/userProfiles/${userId}?mask.fieldPaths=${encodeURIComponent(completedDaysField)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (cdRes.ok) {
        const cdDoc = await cdRes.json();
        const lpF = cdDoc?.fields?.languageProgress?.mapValue?.fields;
        const lkF = lpF?.[langKey]?.mapValue?.fields;
        const pathF = lkF?.[path]?.mapValue?.fields;
        const vals = pathF?.completedDays?.arrayValue?.values;
        if (vals) existingDays = vals.map((v: any) => v.stringValue).filter(Boolean);
      }
    } catch(e) { console.warn('[XP] completedDays focused read error:', e); }
    
    if (!existingDays.includes(dayKey)) {
      existingDays = [...existingDays, dayKey];
    }
    console.log('[XP] writing completedDays:', existingDays.length, 'entries');
    await patchUser(token, userId, { [completedDaysField]: existingDays }, [completedDaysField]);

    console.log(`✅ ${userId} ${langKey}/${path} ${dayKey} | XP: ${currentXP}→${newXP} | Streak: ${currentStreak}→${newStreak}`);

    return NextResponse.json({
      xpPoints: newXP,
      currentStreak: newStreak,
      xpEarned: XP_PER_LESSON,
      isNewDay,
      alreadyCompleted: false,
    });

  } catch (error: any) {
    console.error('complete-lesson error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}