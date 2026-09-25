(() => {
  if (window.__yuuLanguageToggleLoaded) return;
  window.__yuuLanguageToggleLoaded = true;

  const STORAGE_KEY = 'yuu-portfolio-language';
  const supportedLanguages = new Set(['en', 'vi']);
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();

  const syncChuDuNavigation = () => {
    const titles = document.querySelectorAll(
      '.portfolio-sidebar__role-title, .mobile-commercial-role__title'
    );
    titles.forEach((title) => {
      if (!title.textContent.includes('7.4 /')) return;
      const group = title.closest('.portfolio-sidebar__role-group, .mobile-commercial-role');
      const list = group?.querySelector('.portfolio-sidebar__items, .work-items');
      if (!list || list.querySelector('[data-chu-du-nav]')) return;

      const item = document.createElement('li');
      item.dataset.chuDuNav = '';
      item.innerHTML = '<a href="https://www.instagram.com/reel/DdOpnXDpOk4/" target="_blank" rel="noopener">Chu Du ↗</a>';
      list.append(item);
    });
  };

  const exact = {
    'Selected Works': 'Dự án tiêu biểu',
    'Featured Works': 'Dự án nổi bật',
    'An index of commercial production, visual systems, and creative technology.': 'Tuyển tập những dự án trải dài từ sản xuất thương mại, hệ thống thị giác đến công nghệ sáng tạo.',
    'Year': 'Năm',
    'All': 'Tất cả',
    'Showing all projects.': 'Đang hiển thị toàn bộ dự án.',
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
    "7.1 / Director's Creative Team": '7.1 / Nhóm sáng tạo của đạo diễn',
    '7.2 / Art Director': '7.2 / Giám đốc nghệ thuật',
    '7.3 / 3D Concept Modelling Artist': '7.3 / Nghệ sĩ dựng concept 3D',
    '7.4 / Graphic Designer': '7.4 / Nhà thiết kế đồ họa',
    '7.5 / Post Producer': '7.5 / Nhà sản xuất hậu kỳ',
    '7.6 / Creative': '7.6 / Sáng tạo',
    "01 / Director's Creative Team": '01 / Nhóm sáng tạo của đạo diễn',
    '02 / Art Director': '02 / Giám đốc nghệ thuật',
    '03 / 3D Concept Modelling Artist': '03 / Nghệ sĩ dựng concept 3D',
    '04 / Graphic Designer': '04 / Nhà thiết kế đồ họa',
    '05 / Post Producer': '05 / Nhà sản xuất hậu kỳ',
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
    'The Insight': 'Ý tưởng cốt lõi',
    'The Insight & Narrative': 'Ý tưởng & Mạch kể',
    'The Execution & Role': 'Cách thực hiện & Vai trò',
    'How It Works': 'Cách dự án hoạt động',
    'Process': 'Quá trình',
    'Process & Technical Development': 'Quá trình & Phát triển kỹ thuật',
    'Technical Development': 'Phát triển kỹ thuật',
    'Technical Integration': 'Tích hợp kỹ thuật',
    'Design Approach': 'Hướng thiết kế',
    'Design Question': 'Câu hỏi thiết kế',
    'Research Question': 'Câu hỏi nghiên cứu',
    'Visual Direction': 'Định hướng thị giác',
    'Visual References': 'Tham chiếu thị giác',
    'Typographic Approach': 'Hướng xử lý chữ',
    'Concept': 'Ý tưởng',
    'Overview': 'Tổng quan',
    'Narrative': 'Câu chuyện',
    'System': 'Hệ thống',
    'Game System': 'Hệ thống trò chơi',
    'Game Mechanics': 'Cơ chế trò chơi',
    'Characters': 'Nhân vật',
    'Character Concept': 'Ý tưởng nhân vật',
    'Storyboard': 'Kịch bản hình ảnh',
    'Outcome': 'Thành quả',
    'Exhibition & Outcome': 'Triển lãm & Thành quả',
    'Showcase': 'Trưng bày',
    'Reflection': 'Nhìn lại',
    'References': 'Tư liệu tham khảo',
    'Reference': 'Tư liệu tham khảo',
    'Collaborators': 'Cộng tác viên',
    'FULL CREDITS': 'THÔNG TIN ĐỘI NGŨ',
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
    'Nguyen Thu Trang (yuuwouldnever) is a Vietnamese multidisciplinary visual designer whose practice investigates the beauty of everyday life through functional visual works. She makes work that serves a purpose: to open reflection, communicate social conditions, or give form to inner experience. Her creative process is introspective yet communicative.': 'Nguyen Thu Trang (yuuwouldnever) là một nhà thiết kế thị giác đa ngành người Việt Nam. Cô quan sát vẻ đẹp trong đời sống thường ngày và chuyển những quan sát đó thành các thiết kế có chức năng rõ ràng. Mỗi dự án là một cách để gợi mở suy nghĩ, lên tiếng về những điều đang diễn ra trong xã hội hoặc diễn đạt trải nghiệm nội tâm bằng hình ảnh. Cách cô làm việc bắt đầu từ những quan sát rất riêng nhưng luôn hướng tới một cuộc đối thoại với người xem.',
    'is a Vietnamese multidisciplinary visual designer whose practice investigates the beauty of everyday life through functional visual works. She makes work that serves a purpose: to open reflection, communicate social conditions, or give form to inner experience. Her creative process is introspective yet communicative.': 'là một nhà thiết kế thị giác đa ngành người Việt Nam. Cô quan sát vẻ đẹp trong đời sống thường ngày và chuyển những quan sát đó thành các thiết kế có chức năng rõ ràng. Mỗi dự án là một cách để gợi mở suy nghĩ, lên tiếng về những điều đang diễn ra trong xã hội hoặc diễn đạt trải nghiệm nội tâm bằng hình ảnh. Cách cô làm việc bắt đầu từ những quan sát rất riêng nhưng luôn hướng tới một cuộc đối thoại với người xem.',
    'A web-based reflective tool translating personal digital memories into a collective ASCII artwork on traditional student notebook and Do paper.': 'Một công cụ web để nhìn lại ký ức cá nhân. Những ký ức số được chuyển thành một tác phẩm ASCII tập thể, in trên giấy vở học sinh và giấy dó.',
    'An interactive typographic poster translating the spatial texture of Go Vap Market into scan-based imagery, motion, and responsive type.': 'Một poster chữ tương tác, tái hiện nhịp điệu không gian của chợ Gò Vấp qua hình ảnh scan, chuyển động và kiểu chữ phản hồi theo người xem.',
    'A book cover design study exploring two visual directions through illustration, lettering, and typographic pacing.': 'Một thử nghiệm thiết kế bìa sách theo hai hướng thị giác, kết hợp minh họa, lettering và nhịp điệu của chữ.',
    'A 2D-3D visual jockey piece exploring the paradox of emotion and existence through a cyborg pursuit of humanity.': 'Một tác phẩm visual jockey 2D–3D kể về một cyborg đi tìm tính người, qua đó chạm đến nghịch lý giữa cảm xúc và sự tồn tại.',
    'A visual journey of restoration and self-care, brought to life through serene art direction.': 'Một hành trình thị giác về hồi phục và chăm sóc bản thân, được kể bằng art direction nhẹ nhàng và tĩnh lặng.',
    'A high-volume, fast-paced commercial campaign optimized for algorithm-driven social platforms.': 'Một chiến dịch thương mại có khối lượng lớn và nhịp độ gấp, được thiết kế cho cách nội dung vận hành trên mạng xã hội.',
    'A reflective web tool turning digital memories into collective ASCII artworks.': 'Một công cụ web biến ký ức số thành những hình ảnh ASCII được tạo nên từ nhiều người.',
    'An Unreal Engine experience exploring veiled perception and digital space.': 'Một trải nghiệm Unreal Engine về cảm giác bị che phủ giữa không gian số.',
    'A stop-motion and CGI animation about time, routine, and transformation.': 'Một phim stop-motion kết hợp CGI về thời gian, thói quen và sự biến đổi.',
    'A playful Unity tool reimagining pedestrian navigation and public space.': 'Một công cụ Unity vui nhộn, thử hình dung lại cách ta di chuyển trong không gian công cộng.',
    'A 3D character mixing Vietnamese heritage with overseas youth culture.': 'Một nhân vật 3D kết hợp di sản Việt với văn hóa của thế hệ lớn lên ở nước ngoài.',
    'Custom typography developed from Vietnamese print and music references.': 'Một bộ chữ được phát triển từ tư liệu in ấn và âm nhạc Việt Nam.',
    'A restorative beauty film shaped through calm, natural art direction.': 'Một phim làm đẹp về sự hồi phục, được dẫn dắt bằng art direction nhẹ và gần với thiên nhiên.',
    'A lively campaign film connecting Cocoon with Phuong My Chi.': 'Một campaign film giàu năng lượng, kết nối Cocoon với Phương Mỹ Chi.',
    'A compact commercial introducing the Coca-Cola 250ml format.': 'Một TVC ngắn gọn giới thiệu phiên bản Coca-Cola 250ml.',
    'A cinematic esports trailer built for the APL 2026 stage.': 'Một trailer esports mang màu sắc điện ảnh cho sân khấu APL 2026.',
    'A graphic-led music video world created for Hau Hoang.': 'Một thế giới music video được xây dựng bằng ngôn ngữ graphic cho Hậu Hoàng.',
    'A travel commercial delivered through a fast post-production pipeline.': 'Một TVC du lịch được hoàn thiện qua quy trình hậu kỳ nhanh và chặt chẽ.',
    'Concept, Visual System, UI/UX & p5.js Development': 'Ý tưởng, hệ thống thị giác, UI/UX & lập trình p5.js',
    'Director, Concept Artist & 3D Designer': 'Đạo diễn, concept artist & thiết kế 3D',
    'Art Director, Producer & 3D Modeller': 'Giám đốc nghệ thuật, producer & dựng hình 3D',
    'Game Designer, Art Director & 3D Artist': 'Thiết kế game, giám đốc nghệ thuật & nghệ sĩ 3D',
    'Concept, Character Design, Styling & 3D Art': 'Ý tưởng, thiết kế nhân vật, styling & 3D art',
    'Type Designer & Lettering Artist': 'Thiết kế chữ & lettering'
  };

  const fragments = [
    [/Concept, Visual System, UI\/UX & p5\.js Development/g, 'Ý tưởng, hệ thống thị giác, UI/UX & lập trình p5.js'],
    [/Director, Concept Artist & 3D Designer/g, 'Đạo diễn, concept artist & thiết kế 3D'],
    [/Art Director, Producer & 3D Modeller/g, 'Giám đốc nghệ thuật, producer & dựng hình 3D'],
    [/Game Designer, Art Director & 3D Artist/g, 'Thiết kế game, giám đốc nghệ thuật & nghệ sĩ 3D'],
    [/Concept, Character Design, Styling & 3D Art/g, 'Ý tưởng, thiết kế nhân vật, styling & 3D art'],
    [/Type Designer & Lettering Artist/g, 'Thiết kế chữ & lettering'],
    [/\bCode & Print\b/g, 'Lập trình & In ấn'],
    [/\bUnreal Engine Game\b/g, 'Trò chơi trên Unreal Engine'],
    [/\bUnity Game\b/g, 'Trò chơi trên Unity'],
    [/\b3D Character Design\b/g, 'Thiết kế nhân vật 3D'],
    [/\bStop-?motion & CGI\b/g, 'Stop-motion & CGI'],
    [/\bCharacter Design\b/g, 'Thiết kế nhân vật'],
    [/\bExhibition Poster\b/g, 'Poster triển lãm'],
    [/\bBook Cover Design\b/g, 'Thiết kế bìa sách'],
    [/\bInteractive Poster\b/g, 'Poster tương tác'],
    [/\bCommercial Video\b/g, 'Phim quảng cáo'],
    [/\bSocial Campaign\b/g, 'Chiến dịch truyền thông'],
    [/\bSocial Film\b/g, 'Phim mạng xã hội'],
    [/\bMusic Video\b/g, 'MV'],
    [/\bArt Direction\b/g, 'Chỉ đạo nghệ thuật'],
    [/\bArt Director\b/g, 'Giám đốc nghệ thuật'],
    [/\bLead Graphic Designer\b/g, 'Thiết kế đồ họa chính'],
    [/\bGraphic Designer\b/g, 'Nhà thiết kế đồ họa'],
    [/\bPost Producer\b/g, 'Nhà sản xuất hậu kỳ'],
    [/\bDirector's Creative Team\b/g, 'Nhóm sáng tạo của đạo diễn'],
    [/\bCreative for Film Treatment\b/g, 'Phát triển ý tưởng & film treatment'],
    [/\bCustom Typography\b/g, 'Thiết kế chữ tùy biến'],
    [/\bCommercial\b/g, 'Quảng cáo'],
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
  syncChuDuNavigation();
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
      syncChuDuNavigation();
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
