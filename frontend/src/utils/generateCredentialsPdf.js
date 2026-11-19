import { jsPDF } from 'jspdf';

/**
 * Generates an official, beautifully styled PDF Admission & Login Credentials Slip
 * for a newly admitted or existing tenant.
 *
 * @param {Object} details
 * @param {string} details.tenantName
 * @param {string} details.username
 * @param {string} details.password
 * @param {string} [details.phone]
 * @param {string} [details.email]
 * @param {string} [details.buildingName]
 * @param {string} [details.buildingAddress]
 * @param {string} [details.roomNumber]
 * @param {string} [details.bedNumber]
 * @param {number|string} [details.monthlyRent]
 * @param {number|string} [details.securityDeposit]
 * @param {number|string} [details.rentDueDay]
 * @param {string|Date} [details.joiningDate]
 * @param {string} [details.ownerName]
 * @param {string} [details.ownerPhone]
 */
export const generateCredentialsPdf = (details) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor = [30, 41, 59]; // slate-800
  const brandBlue = [79, 70, 229]; // indigo-600
  const emeraldGreen = [16, 185, 129]; // emerald-500
  const darkGray = [51, 65, 85];
  const lightGray = [241, 245, 249];
  const borderGray = [203, 213, 225];

  // 1. Top Decorative Brand Bar
  doc.setFillColor(...brandBlue);
  doc.rect(0, 0, pageWidth, 7, 'F');

  // 2. Header Section
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('PGmate', margin, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text('SMART DIGITAL PG & HOSTEL MANAGEMENT SYSTEM', margin, 25);

  // Document Badge on Right
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.roundedRect(pageWidth - margin - 75, 12, 75, 16, 2, 2, 'F');
  doc.setDrawColor(...brandBlue);
  doc.setLineWidth(0.3);
  doc.roundedRect(pageWidth - margin - 75, 12, 75, 16, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...brandBlue);
  doc.text('OFFICIAL ADMISSION SLIP', pageWidth - margin - 37.5, 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkGray);
  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Issued On: ${todayStr}`, pageWidth - margin - 37.5, 24, { align: 'center' });

  // Divider Line
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.5);
  doc.line(margin, 32, pageWidth - margin, 32);

  let currentY = 38;

  // 3. Property Information Box
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'F');
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text(details.buildingName || 'PGmate Premium Residency', margin + 5, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkGray);
  doc.text(
    details.buildingAddress || 'Standard Accommodation Facility',
    margin + 5,
    currentY + 13
  );
  if (details.ownerPhone) {
    doc.text(`Contact: ${details.ownerPhone} ${details.ownerName ? `(${details.ownerName})` : ''}`, margin + 5, currentY + 18);
  }

  currentY += 28;

  // 4. Resident & Bed Allocation Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('1. Resident & Room Allocation Details', margin, currentY);

  currentY += 4;

  const rowHeight = 7.5;
  const colWidth = contentWidth / 2;

  const residentInfo = [
    ['Resident Name:', details.tenantName || 'Resident'],
    ['Mobile Number:', details.phone || 'N/A'],
    ['Assigned Room:', `Room ${details.roomNumber || 'N/A'}`],
    ['Assigned Bed:', `Bed ${details.bedNumber || 'N/A'}`],
    ['Monthly Rent:', `Rs. ${Number(details.monthlyRent || 0).toLocaleString('en-IN')} / month`],
    ['Security Deposit:', `Rs. ${Number(details.securityDeposit || 0).toLocaleString('en-IN')}`],
    ['Rent Due Day:', `Every ${details.rentDueDay || 5}th of month`],
    ['Admission Date:', details.joiningDate ? new Date(details.joiningDate).toLocaleDateString('en-IN') : todayStr],
  ];

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);

  residentInfo.forEach((item, idx) => {
    const isEven = Math.floor(idx / 2) % 2 === 0;
    const colIndex = idx % 2;
    const itemX = margin + colIndex * colWidth;
    const itemY = currentY + Math.floor(idx / 2) * rowHeight;

    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(itemX, itemY, colWidth, rowHeight, 'F');
    }
    doc.rect(itemX, itemY, colWidth, rowHeight, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkGray);
    doc.text(item[0], itemX + 3, itemY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.text(String(item[1]), itemX + 38, itemY + 5);
  });

  currentY += Math.ceil(residentInfo.length / 2) * rowHeight + 8;

  // 5. PROMINENT LOGIN CREDENTIALS BOX (Essential Requirement)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...brandBlue);
  doc.text('2. Tenant Portal Access & Login Credentials', margin, currentY);

  currentY += 4;

  const boxHeight = 44;
  doc.setFillColor(245, 243, 255); // indigo-50
  doc.setDrawColor(...brandBlue);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, currentY, contentWidth, boxHeight, 3, 3, 'FD');

  // Header inside box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...brandBlue);
  doc.text('CONFIDENTIAL - RESIDENT LOGIN CREDENTIALS', margin + 6, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...darkGray);
  doc.text(
    'Use the official PGmate Username (name@pgname) and password below to log in to your dashboard:',
    margin + 6,
    currentY + 13
  );

  // Portal URL
  const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'http://localhost:5173/login';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text('Portal URL:', margin + 6, currentY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...brandBlue);
  doc.text(portalUrl, margin + 45, currentY + 20);

  // Username (name@pgname)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Username (name@pgname):', margin + 6, currentY + 27);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 45, currentY + 22, 65, 7, 1, 1, 'F');
  doc.setDrawColor(...brandBlue);
  doc.roundedRect(margin + 45, currentY + 22, 65, 7, 1, 1, 'D');
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text(details.username || 'username@pg', margin + 48, currentY + 26.8);

  // Password
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text('Temporary Password:', margin + 6, currentY + 36);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 45, currentY + 31, 65, 7, 1, 1, 'F');
  doc.setDrawColor(...brandBlue);
  doc.roundedRect(margin + 45, currentY + 31, 65, 7, 1, 1, 'D');
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(220, 38, 38); // red
  doc.text(details.password || 'Pass@123', margin + 48, currentY + 35.8);

  currentY += boxHeight + 8;

  // 6. Resident Instructions & Features
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('3. What You Can Do With Your PGmate Account', margin, currentY);

  currentY += 5;

  const instructions = [
    'Generate Daily Meal QR Codes for Breakfast, Lunch & Dinner to record mess attendance.',
    'View monthly rent invoices, download official receipts, and pay rent online via UPI / Cards.',
    'Submit maintenance complaints (plumbing, electrical, Wi-Fi, cleaning) with real-time tracking.',
    'Check published 7-day homestyle meal menus and house announcements directly on your phone.',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkGray);
  instructions.forEach((ins) => {
    doc.setFillColor(...emeraldGreen);
    doc.circle(margin + 2.5, currentY - 1, 1, 'F');
    doc.text(ins, margin + 6, currentY);
    currentY += 5.5;
  });

  currentY += 4;

  // 7. House Rules & Guidelines
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('4. Important House Guidelines', margin, currentY);

  currentY += 4;
  const guidelines = [
    '• Rent must be cleared on or before the due date each month.',
    '• Daily meal QR codes are valid for one scan per meal and cannot be shared.',
    '• 30-day prior written notice is required before moving out to claim the security deposit.',
    '• Respect fellow residents and observe quiet hours between 10:30 PM and 6:00 AM.',
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  guidelines.forEach((g) => {
    doc.text(g, margin + 2, currentY);
    currentY += 4.5;
  });

  // 8. Signature Block at Bottom
  const sigY = pageHeight - 32;
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.4);

  // Resident signature line
  doc.line(margin + 5, sigY, margin + 55, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...darkGray);
  doc.text('Resident Signature', margin + 15, sigY + 4);

  // Owner signature line
  doc.line(pageWidth - margin - 55, sigY, pageWidth - margin - 5, sigY);
  doc.text('Authorized PG Signatory', pageWidth - margin - 50, sigY + 4);

  // Bottom Footer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'PGmate Cloud Platform • Generated automatically upon bed allocation • Valid without manual stamp',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save / trigger download
  const cleanName = (details.tenantName || 'tenant').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `PGmate_Admission_${cleanName}.pdf`;
  doc.save(filename);
  return filename;
};
