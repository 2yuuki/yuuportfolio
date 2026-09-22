(() => {
  if (window.__yuuLanguageToggleLoaded) return;
  window.__yuuLanguageToggleLoaded = true;

  const STORAGE_KEY = 'yuu-portfolio-language';
  const supportedLanguages = new Set(['en', 'vi']);
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();

  const exact = {
    'Selected Works': 'Dự án tiêu biểu',
    'Featured Works': 'Dự án nổi bật',
    'An index of commercial production, visual systems, and creative technology.': 'Tuyển tập các dự án sản xuất thương mại, hệ thống thị giác và công nghệ sáng tạo.',
    'Year': 'Năm',
    'All': 'Tất cả',
    'Showing all projects.': 'Đang hiển thị tất cả dự án.',
    'I. Interactive & Creative Technology': 'I. Tương tác & Công nghệ sáng tạo',
    'II. Typography & Visuals': 'II. Chữ & Thiết kế thị giác',
    'III. Sketches': 'III. Phác thảo',
    'IV. Commercial Production & Music Video': 'IV. Sản xuất thương mại & MV',
    'Work ↓': 'Dự án ↓',
    'Work': 'Dự án',
    'Menu': 'Menu',
    'Close': 'Đóng',
    'Index': 'Mục lục',
    'INDEX': 'MỤC LỤC',
    'TOP': 'ĐẦU TRANG',
    '[View]': '[Xem]',
    'View': 'Xem',
    'Email': 'Email',
    '00 / Featured': '00 / Tiêu biểu',
    '01 / Design': '01 / Thiết kế',
    '01 / Typography': '01 / Typography',
    '02 / CGI': '02 / CGI',
    '02 / Character Design': '02 / Thiết kế nhân vật',
    '03 / Motion': '03 / Chuyển động',
    '04 / Interactive': '04 / Tương tác',
    '05 / Print': '05 / In ấn',
    '06 / Music Video': '06 / MV',
    '07 / Commercials': '07 / Quảng cáo',
    "7.1 / Director's Assistant": '7.1 / Trợ lý đạo diễn',
    '7.2 / Art Director': '7.2 / Giám đốc nghệ thuật',
    '7.3 / 3D Concept Modelling Artist': '7.3 / Nghệ sĩ dựng concept 3D',
    '7.4 / Graphic Designer': '7.4 / Thiết kế đồ họa',
    '7.5 / Post Producer': '7.5 / Sản xuất hậu kỳ',
    '7.6 / Creative': '7.6 / Sáng tạo',
    "01 / Director's Creative Team": '01 / Đội ngũ sáng tạo của đạo diễn',
    '02 / Art Director': '02 / Giám đốc nghệ thuật',
    '03 / 3D Concept Modelling Artist': '03 / Nghệ sĩ dựng concept 3D',
    '04 / Graphic Designer': '04 / Thiết kế đồ họa',
    '05 / Post Producer': '05 / Sản xuất hậu kỳ',
    '06 / Creative': '06 / Sáng tạo',
    'Type': 'Thể loại',
    'Role': 'Vai trò',
    'Agency': 'Đơn vị',
    'Client': 'Khách hàng',
    'Production': 'Sản xuất',
    'Production House': 'Nhà sản xuất',
    'Producer': 'Nhà sản xuất',
    'Tools / Methods': 'Công cụ / Phương pháp',
    'Methods': 'Phương pháp',
    'Method': 'Phương pháp',
    'Links': 'Liên kết',
    'Context': 'Bối cảnh',
    'Client / Context': 'Khách hàng / Bối cảnh',
    'The Context': 'Bối cảnh',
    'The Insight': 'Góc nhìn',
    'The Insight & Narrative': 'Góc nhìn & Câu chuyện',
    'The Execution & Role': 'Thực hiện & Vai trò',
    'How It Works': 'Cách hoạt động',
    'Process': 'Quá trình',
    'Process & Technical Development': 'Quá trình & Phát triển kỹ thuật',
    'Technical Development': 'Phát triển kỹ thuật',
    'Technical Integration': 'Tích hợp kỹ thuật',
    'Design Approach': 'Hướng tiếp cận thiết kế',
    'Design Question': 'Câu hỏi thiết kế',
    'Research Question': 'Câu hỏi nghiên cứu',
    'Visual Direction': 'Định hướng thị giác',
    'Visual References': 'Tham chiếu thị giác',
    'Typographic Approach': 'Hướng tiếp cận typography',
    'Concept': 'Ý tưởng',
    'Overview': 'Tổng quan',
    'Narrative': 'Câu chuyện',
    'System': 'Hệ thống',
    'Game System': 'Hệ thống trò chơi',
    'Game Mechanics': 'Cơ chế trò chơi',
    'Characters': 'Nhân vật',
    'Character Concept': 'Ý tưởng nhân vật',
    'Storyboard': 'Kịch bản hình ảnh',
    'Outcome': 'Kết quả',
    'Exhibition & Outcome': 'Triển lãm & Kết quả',
    'Showcase': 'Trưng bày',
    'Reflection': 'Suy ngẫm',
    'References': 'Tham chiếu',
    'Reference': 'Tham chiếu',
    'Collaborators': 'Cộng tác viên',
    'FULL CREDITS': 'ĐẦY ĐỦ CREDIT',
    'Official Commercial Video.': 'Video quảng cáo chính thức.',
    'Official Music Video.': 'MV chính thức.',
    'Behind The Scenes.': 'Hậu trường.',
    'Behind the scenes.': 'Hậu trường.',
    'Final interaction of the digital poster.': 'Tương tác hoàn chỉnh của poster kỹ thuật số.',
    'Access the tool': 'Truy cập công cụ',
    'Process Book below': 'Process Book bên dưới',
    'Featured in Thanh Nien News': 'Được giới thiệu trên báo Thanh Niên',
    'View Process Book': 'Xem Process Book',
    '1. Write': '1. Viết',
    '2. Process': '2. Xử lý',
    '3. Sketch': '3. Phác thảo',
    '4. Manifest': '4. Hiện thực hóa',
    'Nguyen Thu Trang (yuuwouldnever) is a Vietnamese multidisciplinary visual designer whose practice investigates the beauty of everyday life through functional visual works. She makes work that serves a purpose: to open reflection, communicate social conditions, or give form to inner experience. Her creative process is introspective yet communicative.': 'Nguyen Thu Trang (yuuwouldnever) là một nhà thiết kế thị giác đa ngành người Việt Nam. Thực hành của cô tìm kiếm vẻ đẹp trong đời sống thường ngày thông qua những tác phẩm thị giác có tính ứng dụng. Cô tạo ra các dự án có mục đích: mở ra sự suy ngẫm, truyền đạt những vấn đề xã hội hoặc định hình trải nghiệm nội tâm. Quá trình sáng tạo của cô hướng nội nhưng luôn tìm cách giao tiếp với người xem.',
    'is a Vietnamese multidisciplinary visual designer whose practice investigates the beauty of everyday life through functional visual works. She makes work that serves a purpose: to open reflection, communicate social conditions, or give form to inner experience. Her creative process is introspective yet communicative.': 'là một nhà thiết kế thị giác đa ngành người Việt Nam. Thực hành của cô tìm kiếm vẻ đẹp trong đời sống thường ngày thông qua những tác phẩm thị giác có tính ứng dụng. Cô tạo ra các dự án có mục đích: mở ra sự suy ngẫm, truyền đạt những vấn đề xã hội hoặc định hình trải nghiệm nội tâm. Quá trình sáng tạo của cô hướng nội nhưng luôn tìm cách giao tiếp với người xem.',
    'A web-based reflective tool translating personal digital memories into a collective ASCII artwork on traditional student notebook and Do paper.': 'Một công cụ phản tư trên nền web, chuyển ký ức số cá nhân thành tác phẩm ASCII tập thể trên giấy vở học sinh và giấy dó.',
    'An interactive typographic poster translating the spatial texture of Go Vap Market into scan-based imagery, motion, and responsive type.': 'Một poster typography tương tác, chuyển hóa kết cấu không gian của chợ Gò Vấp thành hình ảnh quét, chuyển động và chữ phản hồi.',
    'A book cover design study exploring two visual directions through illustration, lettering, and typographic pacing.': 'Nghiên cứu thiết kế bìa sách qua hai hướng thị giác, sử dụng minh họa, lettering và nhịp điệu typography.',
    'A 2D-3D visual jockey piece exploring the paradox of emotion and existence through a cyborg pursuit of humanity.': 'Một tác phẩm visual jockey 2D–3D khám phá nghịch lý của cảm xúc và sự tồn tại qua hành trình một cyborg đi tìm tính người.',
    'A visual journey of restoration and self-care, brought to life through serene art direction.': 'Một hành trình thị giác về hồi phục và chăm sóc bản thân, được thể hiện bằng art direction nhẹ nhàng.',
    'A high-volume, fast-paced commercial campaign optimized for algorithm-driven social platforms.': 'Một chiến dịch quảng cáo khối lượng lớn, nhịp độ nhanh, được tối ưu cho nền tảng mạng xã hội vận hành bằng thuật toán.'
  };

  const fragments = [
    [/\bCode & Print\b/g, 'Mã & In ấn'],
    [/\bUnreal Engine Game\b/g, 'Trò chơi Unreal Engine'],
    [/\bUnity Game\b/g, 'Trò chơi Unity'],
    [/\b3D Character Design\b/g, 'Thiết kế nhân vật 3D'],
    [/\bStopmotion & CGI\b/g, 'Stop-motion & CGI'],
    [/\bCharacter Design\b/g, 'Thiết kế nhân vật'],
    [/\bExhibition Poster\b/g, 'Poster triển lãm'],
    [/\bBook Cover Design\b/g, 'Thiết kế bìa sách'],
    [/\bInteractive Poster\b/g, 'Poster tương tác'],
    [/\bCommercial Video\b/g, 'Video quảng cáo'],
    [/\bSocial Campaign\b/g, 'Chiến dịch mạng xã hội'],
    [/\bMusic Video\b/g, 'MV'],
    [/\bArt Direction\b/g, 'Chỉ đạo nghệ thuật'],
    [/\bArt Director\b/g, 'Giám đốc nghệ thuật'],
    [/\bGraphic Designer\b/g, 'Thiết kế đồ họa'],
    [/\bPost Producer\b/g, 'Sản xuất hậu kỳ'],
    [/\bDirector's Assistant\b/g, 'Trợ lý đạo diễn'],
    [/\bCreative for Film Treatment\b/g, 'Sáng tạo film treatment'],
    [/\bCreative\b/g, 'Sáng tạo'],
    [/\bShowing projects from (20\d{2})\./g, 'Đang hiển thị dự án năm $1.']
  ];

  const attributeExact = {
    'Filter projects by year': 'Lọc dự án theo năm',
    'Project categories': 'Danh mục dự án',
    'Back to top': 'Về đầu trang',
    'Portfolio information and work index': 'Thông tin portfolio và mục lục dự án',
    'Previous image': 'Ảnh trước',
    'Next image': 'Ảnh tiếp theo',
    'Featured work highlights': 'Tổng hợp dự án nổi bật',
    'Featured gallery controls': 'Điều khiển gallery dự án nổi bật',
    'Previous project': 'Dự án trước',
    'Next project': 'Dự án tiếp theo'
  };

  const translateValue = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return value;
    let translated = exact[trimmed] || trimmed;
    fragments.forEach(([pattern, replacement]) => {
      translated = translated.replace(pattern, replacement);
    });
    if (translated === trimmed) return value;
    return value.replace(trimmed, translated);
  };

  const shouldSkip = (node) => {
    const parent = node.parentElement;
    return !parent || parent.closest('script, style, code, pre, .language-switcher');
  };

  const translateTree = (container, language) => {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      if (shouldSkip(node)) return;
      if (!originalText.has(node)) originalText.set(node, node.nodeValue);
      const source = originalText.get(node);
      node.nodeValue = language === 'vi' ? translateValue(source) : source;
    });

    const elements = container.nodeType === Node.ELEMENT_NODE
      ? [container, ...container.querySelectorAll('[aria-label], [title]')]
      : Array.from(document.querySelectorAll('[aria-label], [title]'));

    elements.forEach((element) => {
      if (element.closest('.language-switcher')) return;
      if (!originalAttributes.has(element)) {
        originalAttributes.set(element, {
          ariaLabel: element.getAttribute('aria-label'),
          title: element.getAttribute('title')
        });
      }
      const source = originalAttributes.get(element);
      ['ariaLabel', 'title'].forEach((key) => {
        const attribute = key === 'ariaLabel' ? 'aria-label' : 'title';
        const original = source[key];
        if (original === null) return;
        element.setAttribute(attribute, language === 'vi' ? (attributeExact[original] || translateValue(original)) : original);
      });
    });
  };

  const switcher = document.createElement('div');
  switcher.className = 'language-switcher';
  switcher.setAttribute('aria-label', 'Language');
  switcher.innerHTML = `
    <button class="language-switcher__button" type="button" data-language="en" aria-pressed="false">EN</button>
    <span aria-hidden="true">/</span>
    <button class="language-switcher__button" type="button" data-language="vi" aria-pressed="false">VI</button>
  `;

  const getSavedLanguage = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return supportedLanguages.has(saved) ? saved : 'en';
    } catch {
      return 'en';
    }
  };

  let currentLanguage = getSavedLanguage();

  const applyLanguage = (language, persist = true) => {
    currentLanguage = supportedLanguages.has(language) ? language : 'en';
    document.documentElement.lang = currentLanguage;
    translateTree(document.body, currentLanguage);

    switcher.querySelectorAll('[data-language]').forEach((button) => {
      const active = button.dataset.language === currentLanguage;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, currentLanguage); } catch {}
    }

    window.dispatchEvent(new CustomEvent('yuu:languagechange', {
      detail: { language: currentLanguage }
    }));
  };

  switcher.addEventListener('click', (event) => {
    const button = event.target.closest('[data-language]');
    if (button) applyLanguage(button.dataset.language);
  });

  document.body.append(switcher);
  applyLanguage(currentLanguage, false);

  const observer = new MutationObserver((mutations) => {
    if (currentLanguage !== 'vi') return;
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && !node.closest('.language-switcher')) {
          translateTree(node, currentLanguage);
        } else if (node.nodeType === Node.TEXT_NODE && !shouldSkip(node)) {
          if (!originalText.has(node)) originalText.set(node, node.nodeValue);
          node.nodeValue = translateValue(originalText.get(node));
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
