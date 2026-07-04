import confetti from 'canvas-confetti';

// Scrapbook Manager (Updated for 17 pages, 9 spreads, and custom interactive widgets)

export function initScrapbook() {
  const bgMusic = document.getElementById('bg-music');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const volumeSlider = document.getElementById('volume-slider');
  const playIcon = playPauseBtn.querySelector('.icon-play');
  const pauseIcon = playPauseBtn.querySelector('.icon-pause');

  // 1. Music Controls
  if (bgMusic && !bgMusic.paused) {
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
  }

  playPauseBtn.addEventListener('click', () => {
    if (bgMusic.paused) {
      bgMusic.play().then(() => {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
      }).catch(err => console.error("Error playing music:", err));
    } else {
      bgMusic.pause();
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
    }
  });

  volumeSlider.addEventListener('input', () => {
    bgMusic.volume = volumeSlider.value;
  });

  // 1.5. Lightbox Modal handler for viewing photos in full-screen (Carousel slideshow)
  const lightbox = document.getElementById('photo-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
  const lightboxNextBtn = document.getElementById('lightbox-next-btn');
  const lightboxDotsArea = document.getElementById('lightbox-dots-area');

  let carouselImages = [];
  let carouselIndex = 0;
  let carouselCaptionPrefix = '';

  function openLightbox(src, caption) {
    if (!lightbox) return;
    lightbox.classList.add('single-mode');
    lightboxImg.src = src;
    lightboxCaption.innerText = caption || '';
    lightbox.classList.remove('hidden');
    carouselImages = [];
  }

  function openLightboxCarousel(imagesArray, startIndex, captionPrefix) {
    if (!lightbox || !imagesArray || imagesArray.length === 0) return;
    lightbox.classList.remove('single-mode');
    carouselImages = imagesArray;
    carouselIndex = startIndex;
    carouselCaptionPrefix = captionPrefix;
    lightbox.classList.remove('hidden');
    updateCarouselView();
  }

  function updateCarouselView() {
    if (carouselImages.length === 0) return;
    lightboxImg.src = carouselImages[carouselIndex];
    lightboxCaption.innerText = `${carouselCaptionPrefix} (Ảnh ${carouselIndex + 1}/${carouselImages.length})`;

    // Generate dots indicators
    if (lightboxDotsArea) {
      lightboxDotsArea.innerHTML = '';
      carouselImages.forEach((_, idx) => {
        const dot = document.createElement('span');
        dot.className = `lightbox-dot ${idx === carouselIndex ? 'active' : ''}`;
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          carouselIndex = idx;
          updateCarouselView();
        });
        lightboxDotsArea.appendChild(dot);
      });
    }
  }

  if (lightbox) {
    // Close modal when clicking backdrop or close button
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.id === 'lightbox-close-btn' || e.target.classList.contains('lightbox-close')) {
        lightbox.classList.add('hidden');
      }
    });

    // Prev / Next button listeners
    if (lightboxPrevBtn) {
      lightboxPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (carouselImages.length > 0) {
          carouselIndex = (carouselIndex - 1 + carouselImages.length) % carouselImages.length;
          updateCarouselView();
        }
      });
    }

    if (lightboxNextBtn) {
      lightboxNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (carouselImages.length > 0) {
          carouselIndex = (carouselIndex + 1) % carouselImages.length;
          updateCarouselView();
        }
      });
    }

    // Keyboard controls (ArrowLeft, ArrowRight, Escape)
    window.addEventListener('keydown', (e) => {
      if (lightbox.classList.contains('hidden')) return;

      if (e.key === 'Escape') {
        lightbox.classList.add('hidden');
      } else if (!lightbox.classList.contains('single-mode') && carouselImages.length > 0) {
        if (e.key === 'ArrowLeft') {
          carouselIndex = (carouselIndex - 1 + carouselImages.length) % carouselImages.length;
          updateCarouselView();
        } else if (e.key === 'ArrowRight') {
          carouselIndex = (carouselIndex + 1) % carouselImages.length;
          updateCarouselView();
        }
      }
    });
  }

  // 2. Page Navigation Setup
  // Spreads map for 17 pages (0 to 16):
  // Spread 0: [0] (Cover)
  // Spread 1: [1, 2] (Birthday wish & Chalkboard Bên nhau trọn đời)
  // Spread 2: [3, 4] (Puzzle piece chalkboard & Horizontal slider)
  // Spread 3: [5, 6] (Limited gift & Cascading photos)
  // Spread 4: [7, 8] (Letter & Train slider)
  // Spread 5: [9, 10] (August Calendar & Heart Jigsaw)
  // Spread 6: [11, 12] (Coupon chest & Quiz popup)
  // Spread 7: [13, 14] (Coupon usage guidelines & travel polaroid grid)
  // Spread 8: [15, 16] (Sticker canvas & Back cover)
  const spreads = [
    [0],
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8],
    [9, 10],
    [11, 12],
    [13, 14],
    [15, 16]
  ];

  let currentSpreadIndex = 0;
  const totalSpreads = spreads.length;

  const prevBtn = document.getElementById('prev-page-btn');
  const nextBtn = document.getElementById('next-page-btn');
  const pageIndicator = document.getElementById('page-indicator');
  const pages = document.querySelectorAll('.page');

  function updatePageIndicator() {
    if (currentSpreadIndex === 0) {
      pageIndicator.innerText = "Bìa Trước";
    } else if (currentSpreadIndex === totalSpreads - 1) {
      pageIndicator.innerText = "Bìa Sau";
    } else {
      const spreadPages = spreads[currentSpreadIndex];
      pageIndicator.innerText = `Trang ${spreadPages[0]} - ${spreadPages[1]} / 16`;
    }

    // Toggle navigation button disabled states
    if (currentSpreadIndex === 0) {
      prevBtn.classList.add('disabled');
      prevBtn.disabled = true;
    } else {
      prevBtn.classList.remove('disabled');
      prevBtn.disabled = false;
    }

    if (currentSpreadIndex === totalSpreads - 1) {
      nextBtn.classList.add('disabled');
      nextBtn.disabled = true;
    } else {
      nextBtn.classList.remove('disabled');
      nextBtn.disabled = false;
    }
  }

  function showSpread(index, direction = 'next') {
    pages.forEach(p => {
      p.classList.remove('active');
    });

    const activePageIds = spreads[index];
    activePageIds.forEach(id => {
      const pageEl = document.getElementById(`page-${id}`);
      if (pageEl) {
        pageEl.classList.add('active');
      }
    });

    currentSpreadIndex = index;
    updatePageIndicator();

    // Trigger specific animations on page open
    if (index === 4) {
      // Reset train position when entering train page
      const slider = document.getElementById('train-slider');
      if (slider) {
        slider.value = 0;
        updateTrainPositions(0);
      }
    }
  }

  prevBtn.addEventListener('click', () => {
    if (currentSpreadIndex > 0) {
      showSpread(currentSpreadIndex - 1, 'prev');
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentSpreadIndex < totalSpreads - 1) {
      showSpread(currentSpreadIndex + 1, 'next');
    }
  });

  // 3. Dynamic Polaroid User Photo Upload & Caption Persistence (1 to 16)
  for (let i = 1; i <= 16; i++) {
    const polaroidUser = document.getElementById(`polaroid-user-${i}`);
    if (!polaroidUser) continue;

    const fileInput = document.getElementById(`file-input-${i}`);
    const userImg = document.getElementById(`user-img-${i}`);
    const uploadPlaceholder = document.getElementById(`upload-placeholder-${i}`);
    const captionInput = polaroidUser.querySelector('.caption-input');

    // Create edit button dynamically
    const editBtn = document.createElement('div');
    editBtn.className = 'polaroid-edit-btn';
    editBtn.title = 'Thay đổi ảnh';
    editBtn.innerHTML = '📷';
    polaroidUser.appendChild(editBtn);

    // Click editBtn to trigger file input
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    // Click placeholder to trigger file input
    uploadPlaceholder.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    // Click photo to open lightbox instead of triggering file upload
    userImg.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(userImg.src, captionInput.value);
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          const dataUrl = evt.target.result;
          userImg.src = dataUrl;
          userImg.classList.remove('hidden');
          uploadPlaceholder.classList.add('hidden');
          localStorage.setItem(`find-you-user-img-${i}`, dataUrl);
        };
        reader.readAsDataURL(file);
      }
    });

    captionInput.addEventListener('input', () => {
      localStorage.setItem(`find-you-user-caption-${i}`, captionInput.value);
    });

    // Load saved content or default photo from user folder
    const defaultPhotos = [
      '/memories/ho_guom/MYXJ_20260702113555727_save.jpg',
      '/memories/ho_guom/MYXJ_20260702123529828_save.jpg',
      '/memories/ho_guom/MYXJ_20260702141422327_save.jpg',
      '/memories/ho_guom/MYXJ_20260702154948700_save.jpg',
      '/memories/ho_guom/MYXJ_20260702163330274_save.jpg',
      '/memories/ho_guom/MYXJ_20260702172248977_save.jpg',
      '/memories/nha_tho/MYXJ_20260702173050106_save.jpg',
      '/memories/nha_tho/MYXJ_20260702181127610_save.jpg',
      '/memories/nha_tho/MYXJ_20260702191943598_save.jpg',
      '/memories/nha_tho/MYXJ_20260702193229840_save.jpg',
      '/memories/nha_tho/MYXJ_20260702193950801_save.jpg',
      '/memories/cafe_phim/MYXJ_20260702202209569_save.jpg',
      '/memories/cafe_phim/MYXJ_20260702203013187_save.jpg',
      '/memories/cafe_phim/MYXJ_20260702204707510_save.jpg',
      '/memories/cafe_phim/MYXJ_20260702205212119_save.jpg',
      '/memories/cafe_phim/MYXJ_20260702205852469_save.jpg'
    ];

    const savedImg = localStorage.getItem(`find-you-user-img-${i}`);
    if (savedImg) {
      userImg.src = savedImg;
      userImg.classList.remove('hidden');
      uploadPlaceholder.classList.add('hidden');
    } else {
      userImg.src = defaultPhotos[i - 1];
      userImg.classList.remove('hidden');
      uploadPlaceholder.classList.add('hidden');
    }

    const savedCaption = localStorage.getItem(`find-you-user-caption-${i}`);
    if (savedCaption) {
      captionInput.value = savedCaption;
    }
  }

  // 4. Ribbon-tied Package Flap & Vertical Memory Photo Dropdown (Page 4)
  const packageBow = document.getElementById('package-bow-btn');
  const memoryPackage = document.getElementById('memory-package');
  const dropdownString = document.getElementById('dropdown-string-area');

  if (packageBow && memoryPackage && dropdownString) {
    packageBow.addEventListener('click', (e) => {
      e.stopPropagation();
      memoryPackage.classList.add('open');
      dropdownString.classList.remove('hidden');

      // Ribbon untie confetti burst
      confetti({
        particleCount: 40,
        spread: 50,
        colors: ['#ff79c6', '#ffb86c', '#ff5555']
      });
    });
  }

  // Bộ sưu tập ảnh đầy đủ của 7 kỷ niệm (đọc từ các file thật trong thư mục con)
  const memoryGalleries = {
    first_date: [
      '/memories/first_date/Locket_1783054313072_88.jpg',
      '/memories/first_date/Locket_1783054320070_12.jpg',
      '/memories/first_date/Locket_1783054323119_31.jpg',
      '/memories/first_date/Locket_1783054330275_26.jpg',
      '/memories/first_date/Locket_1783054333928_79.jpg',
      '/memories/first_date/Locket_1783054339149_47.jpg',
      '/memories/first_date/Locket_1783054342479_9.jpg'
    ],
    photobooth: [
      '/memories/photobooth/photo1.png',
      '/memories/photobooth/photo2.jpg',
      '/memories/photobooth/photo3.jpg',
      '/memories/photobooth/photo4.png',
      '/memories/photobooth/photo5.jpg',
      '/memories/photobooth/photo6.png',
      '/memories/photobooth/photo7.jpg',
      '/memories/photobooth/photo8.jpg',
      '/memories/photobooth/photo9.jpg',
      '/memories/photobooth/photo10.png',
      '/memories/photobooth/center.jpg'
    ],
    movie: [
      '/memories/movie/Locket_1783054389705_10.jpg',
      '/memories/movie/Locket_1783054392895_19.jpg',
      '/memories/movie/Locket_1783054394798_46.jpg'
    ],
    ula_cafe: [
      '/memories/ula_cafe/Locket_1783054400213_21.jpg',
      '/memories/ula_cafe/Locket_1783054404744_71.jpg',
      '/memories/ula_cafe/Locket_1783054406289_37.jpg',
      '/memories/ula_cafe/Locket_1783054409935_77.jpg',
      '/memories/ula_cafe/Locket_1783054412326_84.jpg'
    ],
    ho_guom: [
      '/memories/ho_guom/IMG_20260702_122704.jpg',
      '/memories/ho_guom/MYXJ_20260701221636303_save.jpg',
      '/memories/ho_guom/MYXJ_20260702011415717_save.jpg',
      '/memories/ho_guom/MYXJ_20260702101058064_save.jpg',
      '/memories/ho_guom/MYXJ_20260702113555727_save.jpg',
      '/memories/ho_guom/MYXJ_20260702123529828_save.jpg',
      '/memories/ho_guom/MYXJ_20260702141422327_save.jpg',
      '/memories/ho_guom/MYXJ_20260702154948700_save.jpg',
      '/memories/ho_guom/MYXJ_20260702163330274_save.jpg',
      '/memories/ho_guom/MYXJ_20260702172248977_save.jpg'
    ],
    nha_tho: [
      '/memories/nha_tho/MYXJ_20260702173050106_save.jpg',
      '/memories/nha_tho/MYXJ_20260702181127610_save.jpg',
      '/memories/nha_tho/MYXJ_20260702191943598_save.jpg',
      '/memories/nha_tho/MYXJ_20260702193229840_save.jpg',
      '/memories/nha_tho/MYXJ_20260702193950801_save.jpg'
    ],
    cafe_phim: [
      '/memories/cafe_phim/MYXJ_20260702202209569_save.jpg',
      '/memories/cafe_phim/MYXJ_20260702203013187_save.jpg',
      '/memories/cafe_phim/MYXJ_20260702204707510_save.jpg',
      '/memories/cafe_phim/MYXJ_20260702205212119_save.jpg',
      '/memories/cafe_phim/MYXJ_20260702205852469_save.jpg',
      '/memories/cafe_phim/IMG_20260629_210124.jpg',
      '/memories/cafe_phim/Locket_1783054436778_49.jpg'
    ]
  };

  const memoryActivities = [
    'first_date',
    'photobooth',
    'movie',
    'ula_cafe',
    'ho_guom',
    'nha_tho',
    'cafe_phim'
  ];

  for (let k = 1; k <= 7; k++) {
    const memPolaroid = document.getElementById(`polaroid-memory-${k}`);
    if (!memPolaroid) continue;

    const fileInput = document.getElementById(`mem-file-${k}`);
    const memImg = document.getElementById(`mem-img-${k}`);
    const editBtn = memPolaroid.querySelector('.polaroid-edit-btn');
    const activityName = memoryActivities[k - 1];

    // Click editBtn to trigger file selection
    if (editBtn && fileInput) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    // Click image to trigger full-screen Lightbox Carousel (slideshow all photos in that directory)
    if (memImg) {
      memImg.addEventListener('click', (e) => {
        e.stopPropagation();
        const captionText = memPolaroid.querySelector('.caption')?.innerText || '';
        // Clean up emojis from title for the slide caption
        const cleanTitle = captionText.replace(' ❤️', '').replace(' 📸', '').replace(' 🍿', '').replace(' ☕', '').replace(' 🌳', '').replace(' ⛪', '').replace(' 🎬', '');
        openLightboxCarousel(memoryGalleries[activityName], 0, cleanTitle);
      });
    }

    // Handle file upload and save to localStorage
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(evt) {
            const dataUrl = evt.target.result;
            memImg.src = dataUrl;
            localStorage.setItem(`find-you-memory-img-${activityName}`, dataUrl);
            // Update the first element of the slide pool
            memoryGalleries[activityName][0] = dataUrl;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Load saved image from localStorage
    const savedMemImg = localStorage.getItem(`find-you-memory-img-${activityName}`);
    if (savedMemImg && memImg) {
      memImg.src = savedMemImg;
      memoryGalleries[activityName][0] = savedMemImg;
    }
  }

  // 5. Train Double Slider Mechanics (Spread 4, Page 8)
  const trainSlider = document.getElementById('train-slider');
  const trainLeft = document.getElementById('train-left');
  const trainRight = document.getElementById('train-right');
  const kissingCouple = document.getElementById('kissing-couple');

  function updateTrainPositions(val) {
    const maxPercentMove = 38; // Moves from edge 0% to center 38% for image width compensation
    const currentPercent = (val / 100) * maxPercentMove;

    if (val >= 95) {
      // Meet at the center, hide trains, reveal kissing couple
      trainLeft.style.opacity = 0;
      trainRight.style.opacity = 0;
      kissingCouple.classList.remove('hidden');

      // Trigger love confetti explosion once
      if (trainSlider.getAttribute('data-triggered') !== 'true') {
        trainSlider.setAttribute('data-triggered', 'true');
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0.3 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 0.7 }
        });
      }
    } else {
      // Still moving, show trains and update positions
      trainLeft.style.opacity = 1;
      trainRight.style.opacity = 1;
      kissingCouple.classList.add('hidden');
      trainSlider.removeAttribute('data-triggered');

      trainLeft.style.left = `${currentPercent}%`;
      trainRight.style.right = `${currentPercent}%`;
    }
  }

  if (trainSlider) {
    trainSlider.addEventListener('input', (e) => {
      updateTrainPositions(e.target.value);
    });
  }

  // 6. August Calendar Circle (Spread 5, Page 9)
  const calendarFeedback = document.getElementById('calendar-feedback');
  const calendarLens = document.getElementById('calendar-lens');
  const calendarCells = document.querySelectorAll('.calendar-days-grid span');

  calendarCells.forEach(cell => {
    cell.addEventListener('click', () => {
      if (cell.innerText === "") return;

      const parentRect = cell.parentElement.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();

      // Position the magnifying lens directly centered over clicked day
      const relativeTop = cellRect.top - parentRect.top - 8;
      const relativeLeft = cellRect.left - parentRect.left - 6;

      calendarLens.style.top = `${relativeTop}px`;
      calendarLens.style.left = `${relativeLeft}px`;

      if (cell.id === 'aug-21-cell') {
        calendarFeedback.innerHTML = "🎉 CHÍNH XÁC! Ngày 21/08 - Sinh nhật của Vợ Yêu! ❤️";
        calendarFeedback.style.color = "#ff79c6";
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 }
        });
      } else {
        calendarFeedback.innerHTML = `Ngày ${cell.innerText.replace('❤️', '')} tháng 8. Không phải sinh nhật của vợ rồi 😜`;
        calendarFeedback.style.color = "#4a3728";
      }
    });
  });

  // 7. Heart Jigsaw Puzzle Drag & Drop (Spread 5, Page 10)
  const puzzleHole = document.getElementById('puzzle-hole-zone');
  const puzzleEnvelope = document.getElementById('puzzle-envelope-btn');
  const puzzlePiecesPool = document.getElementById('puzzle-pieces-pool');

  let activeDragPiece = null;
  let isDraggingPuzzle = false;
  let puzzleStartX = 0;
  let puzzleStartY = 0;
  let originalLeft = '';
  let originalTop = '';

  if (puzzleHole && puzzleEnvelope && puzzlePiecesPool) {
    // Versioned solved state to reset state from previous session
    const savedSolved = localStorage.getItem('find-you-puzzle-solved-v2');
    if (savedSolved === 'true') {
      solvePuzzleInstant();
    } else {
      localStorage.removeItem('find-you-puzzle-solved'); // clear v1 solver state
    }

    function solvePuzzleInstant() {
      puzzleHole.style.backgroundImage = "url('/center.jpg')";
      puzzleHole.style.backgroundPosition = "-47px -38px";
      puzzleHole.style.backgroundSize = "150px 130px";
      puzzleHole.style.backgroundColor = "transparent";
      puzzleHole.style.border = "none";
      puzzleHole.style.boxShadow = "none";
      puzzleHole.classList.add('solved');
      puzzleEnvelope.innerText = "📂";
      puzzlePiecesPool.classList.add('hidden');
    }

    // Click envelope to open and spill pieces
    puzzleEnvelope.addEventListener('click', () => {
      if (puzzleEnvelope.innerText === "📂") return; // already solved/open
      puzzleEnvelope.innerText = "📂";
      puzzlePiecesPool.classList.remove('hidden');

      // Animating pieces spilling out
      const pieces = puzzlePiecesPool.querySelectorAll('.puzzle-piece');
      pieces.forEach((piece, idx) => {
        piece.style.opacity = 0;
        piece.style.transform = "scale(0) translateY(10px)";
        setTimeout(() => {
          piece.style.transition = "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.25)";
          piece.style.opacity = 1;
          piece.style.transform = "scale(1) translateY(0)";
        }, idx * 100);
      });

      confetti({
        particleCount: 20,
        spread: 30,
        colors: ['#ff5555', '#ff79c6']
      });
    });

    // Attach listeners to all pieces
    const allPieces = puzzlePiecesPool.querySelectorAll('.puzzle-piece');
    allPieces.forEach(piece => {
      piece.addEventListener('mousedown', startPuzzleDrag);
      piece.addEventListener('touchstart', startPuzzleDrag, { passive: true });
    });

    function startPuzzleDrag(e) {
      if (puzzleHole.classList.contains('solved')) return;

      activeDragPiece = e.currentTarget;
      isDraggingPuzzle = true;
      activeDragPiece.style.cursor = 'grabbing';
      activeDragPiece.style.zIndex = '50';
      activeDragPiece.classList.remove('returning');
      activeDragPiece.style.transition = 'none';

      const rect = activeDragPiece.getBoundingClientRect();
      const parentRect = activeDragPiece.parentElement.getBoundingClientRect();

      // Switch to absolute relative to parent pool container
      if (activeDragPiece.style.position !== 'absolute') {
        activeDragPiece.style.position = 'absolute';
        activeDragPiece.style.left = `${rect.left - parentRect.left}px`;
        activeDragPiece.style.top = `${rect.top - parentRect.top}px`;
      }

      originalLeft = activeDragPiece.style.left;
      originalTop = activeDragPiece.style.top;

      const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

      puzzleStartX = clientX - activeDragPiece.offsetLeft;
      puzzleStartY = clientY - activeDragPiece.offsetTop;

      window.addEventListener('mousemove', dragPuzzle);
      window.addEventListener('touchmove', dragPuzzle, { passive: false });
    }

    function dragPuzzle(e) {
      if (!isDraggingPuzzle || !activeDragPiece) return;
      if (e.cancelable) e.preventDefault();

      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

      let leftVal = clientX - puzzleStartX;
      let topVal = clientY - puzzleStartY;

      activeDragPiece.style.left = `${leftVal}px`;
      activeDragPiece.style.top = `${topVal}px`;
    }

    window.addEventListener('mouseup', stopPuzzleDrag);
    window.addEventListener('touchend', stopPuzzleDrag);

    function stopPuzzleDrag() {
      if (!isDraggingPuzzle || !activeDragPiece) return;
      isDraggingPuzzle = false;
      activeDragPiece.style.cursor = 'grab';

      window.removeEventListener('mousemove', dragPuzzle);
      window.removeEventListener('touchmove', dragPuzzle);

      const holeRect = puzzleHole.getBoundingClientRect();
      const pieceRect = activeDragPiece.getBoundingClientRect();

      // Find centers
      const pieceCenter = {
        x: pieceRect.left + pieceRect.width / 2,
        y: pieceRect.top + pieceRect.height / 2
      };
      const holeCenter = {
        x: holeRect.left + holeRect.width / 2,
        y: holeRect.top + holeRect.height / 2
      };

      const dist = Math.sqrt(
        Math.pow(pieceCenter.x - holeCenter.x, 2) + 
        Math.pow(pieceCenter.y - holeCenter.y, 2)
      );

      // Check correct pieces and snap closer than 35px
      if (activeDragPiece.classList.contains('correct-piece') && dist < 35) {
        puzzleHole.style.backgroundImage = "url('/center.jpg')";
        puzzleHole.style.backgroundPosition = "-47px -38px";
        puzzleHole.style.backgroundSize = "150px 130px";
        puzzleHole.style.backgroundColor = "transparent";
        puzzleHole.style.border = "none";
        puzzleHole.style.boxShadow = "none";
        puzzleHole.classList.add('solved');

        activeDragPiece.style.display = 'none';
        puzzlePiecesPool.style.opacity = '0';
        setTimeout(() => {
          puzzlePiecesPool.classList.add('hidden');
        }, 500);

        localStorage.setItem('find-you-puzzle-solved-v2', 'true');

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ff79c6', '#ff5555', '#bd93f9']
        });
      } else {
        // Snap back
        activeDragPiece.classList.add('returning');
        activeDragPiece.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.25)';
        activeDragPiece.style.left = originalLeft;
        activeDragPiece.style.top = originalTop;

        // Shake if wrong piece dragged to hole
        if (dist < 35) {
          activeDragPiece.style.animation = 'shakeWrong 0.4s';
          setTimeout(() => {
            activeDragPiece.style.animation = '';
          }, 400);
        }

        setTimeout(() => {
          if (activeDragPiece) {
            activeDragPiece.classList.remove('returning');
            activeDragPiece.style.zIndex = '30';
          }
        }, 300);
      }
      activeDragPiece = null;
    }
  }

  // 8. Love Coupon Gift Box drawing (Spread 6, Page 11)
  const giftBox = document.getElementById('gift-box-trigger');
  const giftLid = document.getElementById('gift-box-lid');
  const drawnCoupon = document.getElementById('drawn-coupon');
  const couponText = document.getElementById('coupon-text');
  const drawAgainBtn = document.getElementById('draw-again-btn');

  const coupons = [
    "Coupon ăn tối chồng nấu & dọn dẹp",
    "Coupon ôm ấm áp 100 lần",
    "Coupon mua sắm quần áo thỏa thích",
    "Coupon mát-xa vai gáy 30 phút",
    "Coupon tha lỗi vô điều kiện 💖",
    "Coupon đi trà sữa chồng trả tiền",
    "Coupon đi du lịch xả stress cuối tuần"
  ];

  if (giftBox) {
    giftBox.addEventListener('click', () => {
      if (giftBox.classList.contains('open')) return;

      giftBox.classList.add('open');
      
      // Select random coupon
      const random = coupons[Math.floor(Math.random() * coupons.length)];
      couponText.innerText = random;

      setTimeout(() => {
        drawnCoupon.classList.remove('hidden');
        drawAgainBtn.classList.remove('hidden');
      }, 300);
    });

    drawAgainBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      drawnCoupon.classList.add('hidden');
      drawAgainBtn.classList.add('hidden');
      giftBox.classList.remove('open');
    });
  }

  // 9. Pop-up Arch & Love Quiz (Spread 6, Page 12)
  const quizButtons = document.querySelectorAll('.quiz-opt-btn');
  const quizFeedback = document.getElementById('quiz-feedback');

  quizButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Reset state of all buttons
      quizButtons.forEach(b => {
        b.classList.remove('correct');
        b.classList.remove('incorrect');
      });

      const isCorrect = btn.getAttribute('data-correct') === 'true';
      if (isCorrect) {
        btn.classList.add('correct');
        quizFeedback.innerHTML = "🎉 CHÍNH XÁC! Yêu thương vợ nhất trên đời! ❤️";
        quizFeedback.style.color = "#ff79c6";
        
        // Popup arch love jump
        const cutout = document.querySelector('.arch-couple-cutout');
        if (cutout) {
          cutout.style.transform = "translateX(-50%) rotateX(0deg) scale(1.2)";
          setTimeout(() => {
            cutout.style.transform = "translateX(-50%) rotateX(0deg) scale(1.0)";
          }, 400);
        }

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } else {
        btn.classList.add('incorrect');
        quizFeedback.innerHTML = "Sai rồi nhé, chọn lại đi nào! 😜";
        quizFeedback.style.color = "#8b5a2b";
      }
    });
  });

  // 10. Sticker Placement & Dragging System (Page 15)
  const stickerOpts = document.querySelectorAll('.sticker-opt');
  const canvasArea = document.getElementById('scrapbook-canvas-area');
  const clearStickersBtn = document.getElementById('clear-stickers-btn');
  let selectedSticker = '❤️';

  stickerOpts.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      stickerOpts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedSticker = opt.getAttribute('data-sticker');
    });
  });

  if (canvasArea) {
    canvasArea.addEventListener('click', (e) => {
      if (e.target === clearStickersBtn) return;
      
      const rect = canvasArea.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      placeSticker(selectedSticker, x, y);
      saveStickersToStorage();
    });

    function placeSticker(sticker, x, y, rotation = null) {
      const hint = canvasArea.querySelector('.canvas-hint');
      if (hint) hint.classList.add('hidden');

      const stickerEl = document.createElement('div');
      stickerEl.className = 'placed-sticker';
      stickerEl.innerText = sticker;
      stickerEl.style.left = `${x}%`;
      stickerEl.style.top = `${y}%`;

      const rot = rotation !== null ? rotation : (Math.random() * 40 - 20);
      stickerEl.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
      stickerEl.setAttribute('data-rot', rot);
      stickerEl.setAttribute('data-sticker-char', sticker);

      let isDragging = false;
      let dragStartX = 0;
      let dragStartY = 0;

      stickerEl.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isDragging = true;
        stickerEl.style.cursor = 'grabbing';
        const rect = canvasArea.getBoundingClientRect();
        dragStartX = e.clientX - (parseFloat(stickerEl.style.left) / 100) * rect.width;
        dragStartY = e.clientY - (parseFloat(stickerEl.style.top) / 100) * rect.height;
      });

      // Touch drag support
      stickerEl.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        isDragging = true;
        const rect = canvasArea.getBoundingClientRect();
        dragStartX = e.touches[0].clientX - (parseFloat(stickerEl.style.left) / 100) * rect.width;
        dragStartY = e.touches[0].clientY - (parseFloat(stickerEl.style.top) / 100) * rect.height;
      }, { passive: true });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const rect = canvasArea.getBoundingClientRect();
        let currentX = e.clientX - dragStartX;
        let currentY = e.clientY - dragStartY;
        updateStickerDragPosition(stickerEl, rect, currentX, currentY);
      });

      window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const rect = canvasArea.getBoundingClientRect();
        let currentX = e.touches[0].clientX - dragStartX;
        let currentY = e.touches[0].clientY - dragStartY;
        updateStickerDragPosition(stickerEl, rect, currentX, currentY);
      }, { passive: false });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          stickerEl.style.cursor = 'grab';
          saveStickersToStorage();
        }
      });

      window.addEventListener('touchend', () => {
        if (isDragging) {
          isDragging = false;
          saveStickersToStorage();
        }
      });

      canvasArea.appendChild(stickerEl);
    }

    function updateStickerDragPosition(el, rect, currentX, currentY) {
      if (currentX < 0) currentX = 0;
      if (currentX > rect.width) currentX = rect.width;
      if (currentY < 0) currentY = 0;
      if (currentY > rect.height) currentY = rect.height;

      const pctX = (currentX / rect.width) * 100;
      const pctY = (currentY / rect.height) * 100;

      el.style.left = `${pctX}%`;
      el.style.top = `${pctY}%`;
    }

    clearStickersBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const placed = canvasArea.querySelectorAll('.placed-sticker');
      placed.forEach(s => s.remove());
      const hint = canvasArea.querySelector('.canvas-hint');
      if (hint) hint.classList.remove('hidden');
      localStorage.removeItem('find-you-stickers');
    });

    function saveStickersToStorage() {
      const list = [];
      const placed = canvasArea.querySelectorAll('.placed-sticker');
      placed.forEach(s => {
        list.push({
          sticker: s.getAttribute('data-sticker-char'),
          x: parseFloat(s.style.left),
          y: parseFloat(s.style.top),
          rotation: parseFloat(s.getAttribute('data-rot'))
        });
      });
      localStorage.setItem('find-you-stickers', JSON.stringify(list));
    }

    function loadStickersFromStorage() {
      const saved = localStorage.getItem('find-you-stickers');
      if (saved) {
        try {
          const list = JSON.parse(saved);
          if (list.length > 0) {
            const hint = canvasArea.querySelector('.canvas-hint');
            if (hint) hint.classList.add('hidden');
            list.forEach(item => {
              placeSticker(item.sticker, item.x, item.y, item.rotation);
            });
          }
        } catch (err) {
          console.error("Error loading stickers:", err);
        }
      }
    }

    loadStickersFromStorage();
  }

  // Initialize view
  showSpread(0);
}
