// Voice Command Handler with Smart Intent Recognition and History
function handleVoiceCommand(command) {
  console.log('음성 명령:', command);
  
  const lowerCommand = command.toLowerCase().replace(/\s/g, '');
  
  // Get user name with title
  const userName = `${currentUserName} ${currentUserTitle}`;
  
  // Intent 1: 일거리 찾기 (Jobs)
  if (lowerCommand.includes('일') || 
      lowerCommand.includes('일자리') || 
      lowerCommand.includes('돈') || 
      lowerCommand.includes('알바') ||
      lowerCommand.includes('직장') ||
      lowerCommand.includes('구인') ||
      lowerCommand.includes('아르바이트')) {
    const result = '일거리 찾기 페이지로 이동';
    addToVoiceHistory(command, result);
    speak(`네, 알겠습니다. ${userName}. 일거리 찾기 페이지로 이동합니다.`);
    setTimeout(() => {
      window.location.href = '/jobs';
    }, 2000);
    stopVoice();
    return;
  }
  
  // Intent 2: 동네 이야기 (Community)
  if (lowerCommand.includes('심심') || 
      lowerCommand.includes('이야기') || 
      lowerCommand.includes('대화') ||
      lowerCommand.includes('채팅') ||
      lowerCommand.includes('친구') ||
      lowerCommand.includes('동네') ||
      lowerCommand.includes('이웃')) {
    const result = '동네 이야기 페이지로 이동';
    addToVoiceHistory(command, result);
    speak(`네, 알겠습니다. ${userName}. 동네 이야기 페이지로 이동합니다.`);
    setTimeout(() => {
      window.location.href = '/community';
    }, 2000);
    stopVoice();
    return;
  }
  
  // Intent 3: 나눔 장터 (Marketplace)
  if (lowerCommand.includes('장터') || 
      lowerCommand.includes('사고싶') || 
      lowerCommand.includes('주문') ||
      lowerCommand.includes('구매') ||
      lowerCommand.includes('판매') ||
      lowerCommand.includes('나눔') ||
      lowerCommand.includes('중고') ||
      lowerCommand.includes('쇼핑')) {
    const result = '나눔 장터 페이지로 이동';
    addToVoiceHistory(command, result);
    speak(`네, 알겠습니다. ${userName}. 나눔 장터 페이지로 이동합니다.`);
    setTimeout(() => {
      window.location.href = '/marketplace';
    }, 2000);
    stopVoice();
    return;
  }
  
  // Intent 4: 복약 시간 알림
  if (lowerCommand.includes('복약') || 
      lowerCommand.includes('약') ||
      lowerCommand.includes('먹을시간') ||
      lowerCommand.includes('약시간')) {
    const result = '복약 시간 안내';
    addToVoiceHistory(command, result);
    speak(`${userName}, 오늘 저녁 6시에 비타민을 드실 시간입니다. 건강 페이지로 이동합니다.`);
    setTimeout(() => {
      window.location.href = '/health';
    }, 3000);
    stopVoice();
    return;
  }
  
  // Intent 5: 오늘 할 일
  if (lowerCommand.includes('오늘') && (lowerCommand.includes('할일') || lowerCommand.includes('일정') || lowerCommand.includes('계획'))) {
    const result = '오늘의 할 일 안내';
    addToVoiceHistory(command, result);
    speak(`${userName}, 오늘 할 일을 알려드립니다. 복약 1건이 남아있고, 공원 산책 일정이 있습니다. 건강 페이지로 이동합니다.`);
    setTimeout(() => {
      window.location.href = '/health';
    }, 4000);
    stopVoice();
    return;
  }
  
  // Text size commands
  if (lowerCommand.includes('글씨') || lowerCommand.includes('글자')) {
    if (lowerCommand.includes('크게') || lowerCommand.includes('키워')) {
      const result = '글씨 크기를 크게 변경';
      addToVoiceHistory(command, result);
      speak(`네, 알겠습니다. ${userName}. 글씨를 크게 변경합니다.`);
      setTimeout(() => {
        changeTextSize('large');
      }, 1500);
      stopVoice();
      return;
    } else if (lowerCommand.includes('작게') || lowerCommand.includes('줄여')) {
      const result = '글씨 크기를 작게 변경';
      addToVoiceHistory(command, result);
      speak(`네, 알겠습니다. ${userName}. 글씨를 작게 변경합니다.`);
      setTimeout(() => {
        changeTextSize('small');
      }, 1500);
      stopVoice();
      return;
    } else if (lowerCommand.includes('보통')) {
      const result = '글씨 크기를 보통으로 변경';
      addToVoiceHistory(command, result);
      speak(`네, 알겠습니다. ${userName}. 글씨를 보통 크기로 변경합니다.`);
      setTimeout(() => {
        changeTextSize('medium');
      }, 1500);
      stopVoice();
      return;
    }
  }
  
  // Navigation commands
  if (lowerCommand.includes('뉴스')) {
    const result = '뉴스 페이지로 이동';
    addToVoiceHistory(command, result);
    speak(`네, 알겠습니다. ${userName}. 뉴스 페이지로 이동합니다.`);
    setTimeout(() => {
      window.location.href = '/news';
    }, 2000);
    stopVoice();
    return;
  }
  
  if (lowerCommand.includes('날씨')) {
    const result = '날씨 페이지로 이동';
    addToVoiceHistory(command, result);
    speak(`네, 알겠습니다. ${userName}. 날씨 정보를 확인합니다.`);
    setTimeout(() => {
      window.location.href = '/weather';
    }, 2000);
    stopVoice();
    return;
  }
  
  if (lowerCommand.includes('건강')) {
    const result = '건강 페이지로 이동';
    addToVoiceHistory(command, result);
    speak(`네, 알겠습니다. ${userName}. 건강 페이지로 이동합니다.`);
    setTimeout(() => {
      window.location.href = '/health';
    }, 2000);
    stopVoice();
    return;
  }
  
  if (lowerCommand.includes('설정')) {
    const result = '설정 페이지로 이동';
    addToVoiceHistory(command, result);
    speak(`네, 알겠습니다. ${userName}. 설정 페이지로 이동합니다.`);
    setTimeout(() => {
      window.location.href = '/settings';
    }, 2000);
    stopVoice();
    return;
  }
  
  if (lowerCommand.includes('홈') || lowerCommand.includes('처음')) {
    const result = '홈 화면으로 이동';
    addToVoiceHistory(command, result);
    speak(`네, 알겠습니다. ${userName}. 홈 화면으로 이동합니다.`);
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
    stopVoice();
    return;
  }
  
  // Default response
  const result = '명령을 이해하지 못함';
  addToVoiceHistory(command, result);
  speak(`${userName}, "${command}" 명령을 이해하지 못했습니다. 다시 말씀해주시거나, 일자리 찾기, 동네 이야기, 나눔 장터, 복약 시간 알려줘 등을 말씀해주세요.`);
  setTimeout(() => {
    stopVoice();
  }, 5000);
}
