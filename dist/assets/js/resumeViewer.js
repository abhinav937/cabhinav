function handleViewClick(event) {
  const viewIcon = document.getElementById('viewIcon');
  const viewLink = document.getElementById('viewLink');
  
  // Detect if the user is on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // On mobile, let the default behavior (open in new tab) happen
    return true;
  } else {
    // On desktop, prevent default (new tab) and toggle the viewer
    event.preventDefault();
    togglePDFViewer();
    return false;
  }
}

function togglePDFViewer() {
  const viewer = document.getElementById('pdfViewerContainer');
  const viewIcon = document.getElementById('viewIcon');
  const viewLink = document.getElementById('viewLink');
  
  const isHidden = viewer.style.display === 'none' || viewer.style.display === '';
  viewer.style.display = isHidden ? 'block' : 'none';
  
  viewIcon.textContent = isHidden ? 'visibility_off' : 'visibility';
  viewLink.setAttribute('aria-label', isHidden ? 'Hide resume' : 'Show resume');
}