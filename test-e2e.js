// End-to-end test verification script for HelpDesk
import http from 'http';

async function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

function makeReq(method, path, data = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return request({
    hostname: 'localhost',
    port: 3000,
    path,
    method,
    headers
  }, data);
}

async function runTests() {
  console.log('=== STARTING HELPDESK FULL AUDIT & E2E VERIFICATION ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await makeReq('GET', '/health');
    assert(health.status === 200 && health.body.status === 'ok', 'Server health check returned 200 OK');

    // 2. Fetch categories
    const categories = await makeReq('GET', '/api/categories');
    assert(categories.status === 200 && Array.isArray(categories.body) && categories.body.length > 0, `Fetched ${categories.body?.length || 0} service categories`);

    // 3. Customer registration
    const testCustEmail = `customer_${Date.now()}@example.com`;
    const custReg = await makeReq('POST', '/api/auth/register', {
      name: 'Nimal Perera',
      email: testCustEmail,
      password: 'password123',
      phone: '+94771234567',
      role: 'CUSTOMER'
    });
    assert(custReg.status === 201 && custReg.body.token, 'Customer registration succeeded with JWT token');
    const custToken = custReg.body.token;

    // 4. Customer login
    const custLogin = await makeReq('POST', '/api/auth/login', {
      email: testCustEmail,
      password: 'password123'
    });
    assert(custLogin.status === 200 && custLogin.body.user.email === testCustEmail, 'Customer login succeeded');

    // 5. Customer profile update (PUT /api/users/me)
    const profileUpdate = await makeReq('PUT', '/api/users/me', {
      name: 'Nimal S. Perera',
      phone: '+94771234999'
    }, custToken);
    assert(profileUpdate.status === 200 && profileUpdate.body.name === 'Nimal S. Perera', 'Customer profile updated successfully via /api/users/me');

    // 6. Manage Customer Addresses (POST /api/users/addresses)
    const addAddress = await makeReq('POST', '/api/users/addresses', {
      label: 'Home Apartment',
      addressLine: '45 Galle Road, Bambalapitiya',
      city: 'Colombo 04',
      district: 'Colombo',
      isDefault: true
    }, custToken);
    assert(addAddress.status === 201 && addAddress.body.label === 'Home Apartment', 'Saved customer address created successfully');

    // 7. Customer Preferences / App Settings (PUT /api/users/app-settings)
    const updatePrefs = await makeReq('PUT', '/api/users/app-settings', {
      language: 'si',
      currency: 'LKR'
    }, custToken);
    assert(updatePrefs.status === 200 && updatePrefs.body.user?.appSettings?.language === 'si', 'Customer app settings saved successfully');

    // 8. AI Diagnosis / Classification endpoint (POST /api/ai/classify)
    const aiDiag = await makeReq('POST', '/api/ai/classify', {
      problemDescription: 'Water leaking heavily from bathroom ceiling pipe'
    }, custToken);
    assert(aiDiag.status === 200 && aiDiag.body.suggestedCategoryName, `AI Diagnosis classified category: ${aiDiag.body?.suggestedCategoryName} (Urgency: ${aiDiag.body?.urgency})`);

    // 9. Customer creates a service request (POST /api/service-requests)
    const bookingRes = await makeReq('POST', '/api/service-requests', {
      categoryId: 'cat-plumbing',
      title: 'Bathroom Pipe Leak Repair',
      description: 'Water leaking heavily from bathroom ceiling pipe',
      urgency: 'EMERGENCY',
      address: '45 Galle Road, Bambalapitiya',
      city: 'Colombo 04',
      district: 'Colombo',
      preferredDate: '2026-10-15',
      preferredTime: '10:00 AM'
    }, custToken);
    assert(bookingRes.status === 201 && bookingRes.body.bookingReference, `Service request created with reference ${bookingRes.body?.bookingReference} (Status: ${bookingRes.body?.status})`);
    const bookingId = bookingRes.body.id;

    // 10. Fetch booking status
    const getBooking = await makeReq('GET', `/api/service-requests/${bookingId}`, null, custToken);
    assert(getBooking.status === 200 && getBooking.body.status === 'PENDING', 'Booking retrieved with initial PENDING status');

    // 11. Provider Registration & Verification Check
    const testProvEmail = `provider_${Date.now()}@example.com`;
    const provReg = await makeReq('POST', '/api/auth/register', {
      name: 'Kamal Silva',
      email: testProvEmail,
      password: 'password123',
      phone: '+94779876543',
      role: 'PROVIDER',
      serviceCategoryIds: ['cat-plumbing'],
      experienceYears: 5
    });
    assert(provReg.status === 201 && provReg.body.token, 'Provider registration created account');
    const provToken = provReg.body.token;
    const providerProfileId = provReg.body.providerProfile?.id;

    // 12. Provider tries to accept before verification (should fail)
    const unverifiedAccept = await makeReq('PUT', `/api/service-requests/${bookingId}/accept`, {}, provToken);
    assert(unverifiedAccept.status === 400 || unverifiedAccept.status === 403, 'Unverified provider correctly rejected from accepting booking');

    // 13. Admin Login & Provider Approval
    const adminLogin = await makeReq('POST', '/api/auth/login', {
      email: 'admin@helpdesk.lk',
      password: 'password123'
    });
    assert(adminLogin.status === 200 && adminLogin.body.user?.role === 'ADMIN', 'Admin authentication succeeded');
    const adminToken = adminLogin.body.token;

    // Verify provider by admin
    const verifyProv = await makeReq('PUT', `/api/admin/providers/${providerProfileId}/verification`, {
      status: 'APPROVED',
      notes: 'Credentials and government NVQ certificates verified'
    }, adminToken);
    assert(verifyProv.status === 200 && verifyProv.body.verificationStatus === 'APPROVED', 'Admin successfully approved provider account');

    // 14. Provider accepts booking (PUT /api/service-requests/:id/accept)
    const verifiedAccept = await makeReq('PUT', `/api/service-requests/${bookingId}/accept`, {}, provToken);
    assert(verifiedAccept.status === 200 && verifiedAccept.body.booking?.status === 'ACCEPTED', 'Verified provider successfully accepted booking (Status: ACCEPTED)');

    // 15. Provider updates status to ON_THE_WAY
    const onTheWay = await makeReq('PUT', `/api/service-requests/${bookingId}/status`, {
      status: 'ON_THE_WAY',
      note: 'Departing workshop. ETA 15 minutes.'
    }, provToken);
    assert(onTheWay.status === 200 && onTheWay.body.booking?.status === 'ON_THE_WAY', 'Provider updated status to ON_THE_WAY');

    // 16. Provider updates status to ARRIVED
    const arrived = await makeReq('PUT', `/api/service-requests/${bookingId}/status`, {
      status: 'ARRIVED',
      note: 'Arrived at customer premises.'
    }, provToken);
    assert(arrived.status === 200 && arrived.body.booking?.status === 'ARRIVED', 'Provider updated status to ARRIVED');

    // 17. Provider updates status to IN_PROGRESS
    const inProgress = await makeReq('PUT', `/api/service-requests/${bookingId}/status`, {
      status: 'IN_PROGRESS',
      note: 'Commenced plumbing pipe leak inspection.'
    }, provToken);
    assert(inProgress.status === 200 && inProgress.body.booking?.status === 'IN_PROGRESS', 'Provider updated status to IN_PROGRESS');

    // 18. Provider quotes additional material cost
    const materialQuote = await makeReq('POST', `/api/service-requests/${bookingId}/propose-cost`, {
      description: 'Heavy-Duty 1-inch PVC elbow joint and seal tape',
      amountLkr: 850,
      category: 'MATERIALS'
    }, provToken);
    assert(materialQuote.status === 200 && materialQuote.body.booking?.additionalChargeProposals?.length > 0, 'Provider proposed extra material cost to customer');
    const proposalId = materialQuote.body.booking.additionalChargeProposals[0].id;

    // 19. Customer approves material cost
    const approveMaterial = await makeReq('PUT', `/api/service-requests/${bookingId}/respond-cost`, {
      proposalId,
      approved: true,
      customerNotes: 'Approved for replacement.'
    }, custToken);
    assert(approveMaterial.status === 200 && approveMaterial.body.booking?.additionalChargeProposals[0]?.status === 'APPROVED', 'Customer successfully approved material cost');

    // 20. Provider marks work finished -> AWAITING_CUSTOMER_CONFIRMATION
    const awaitingConfirm = await makeReq('PUT', `/api/service-requests/${bookingId}/status`, {
      status: 'AWAITING_CUSTOMER_CONFIRMATION',
      completionNotes: 'Replaced pipe elbow, pressurized and checked for zero leaks.'
    }, provToken);
    assert(awaitingConfirm.status === 200 && awaitingConfirm.body.booking?.status === 'AWAITING_CUSTOMER_CONFIRMATION', 'Provider submitted job for customer verification');

    // 21. Customer confirms completion & signs off
    const confirmCompletion = await makeReq('PUT', `/api/service-requests/${bookingId}/confirm-completion`, {}, custToken);
    assert(confirmCompletion.status === 200 && confirmCompletion.body.booking?.status === 'COMPLETED', 'Customer confirmed completion and signed off (Status: COMPLETED)');

    // 22. Customer submits review & rating
    const reviewRes = await makeReq('POST', `/api/service-requests/${bookingId}/reviews`, {
      rating: 5,
      comment: 'Excellent, prompt, and solved the leak immediately! Very polite technician.',
      tags: ['Punctual', 'Clean Work', 'Skilled']
    }, custToken);
    assert(reviewRes.status === 201 && reviewRes.body.review?.rating === 5, 'Customer submitted 5-star review');

    // 23. Test Customer Filing Complaint / Support Ticket
    const complaintRes = await makeReq('POST', `/api/service-requests/${bookingId}/complaints`, {
      subject: 'Inquiry regarding final invoice breakdown',
      description: 'Need official VAT/tax receipt copy for company reimbursement.'
    }, custToken);
    assert(complaintRes.status === 201 && complaintRes.body.complaint?.id, 'Customer successfully filed support ticket/complaint');

    // 24. Admin resolves complaint
    const resolveComplaint = await makeReq('PUT', `/api/complaints/${complaintRes.body.complaint.id}`, {
      status: 'RESOLVED',
      resolutionNotes: 'Invoice sent via email.'
    }, adminToken);
    assert(resolveComplaint.status === 200 && resolveComplaint.body?.status === 'RESOLVED', 'Admin resolved customer complaint');

    // 25. Admin Analytics / Dashboard
    const dashboardRes = await makeReq('GET', '/api/admin/dashboard', null, adminToken);
    assert(dashboardRes.status === 200 && dashboardRes.body.stats?.totalBookings > 0, `Admin dashboard verified (Total Bookings: ${dashboardRes.body?.stats?.totalBookings})`);

    // 26. Role-Based Access Control: Regular customer cannot access Admin endpoints
    const unauthorizedAdminAccess = await makeReq('GET', '/api/admin/dashboard', null, custToken);
    assert(unauthorizedAdminAccess.status === 403, 'Customer correctly forbidden from accessing admin endpoints (403 Forbidden)');

    // 27. GET /api/users/me returns authenticated customer profile
    const userMeRes = await makeReq('GET', '/api/users/me', null, custToken);
    assert(userMeRes.status === 200 && userMeRes.body.email === testCustEmail, 'GET /api/users/me successfully returns customer profile');

    // 28. GET /api/providers/me returns authenticated provider profile
    const provMeRes = await makeReq('GET', '/api/providers/me', null, provToken);
    assert(provMeRes.status === 200 && provMeRes.body.id === providerProfileId, 'GET /api/providers/me returns provider profile');

    // 29. POST /api/providers/verification documents update
    const updateVerificationRes = await makeReq('POST', '/api/providers/verification', {
      nationalIdUrl: 'https://example.com/nic-verified.jpg',
      certificateUrl: 'https://example.com/nvq-plumbing.jpg',
      experienceYears: 6
    }, provToken);
    assert(updateVerificationRes.status === 200 && updateVerificationRes.body.profile?.verificationStatus === 'PENDING_VERIFICATION', 'POST /api/providers/verification successfully resubmits verification documents');

    // 30. Multi-Role mode switching: provider switches to CUSTOMER and back
    const switchModeRes = await makeReq('POST', '/api/auth/switch-mode', { targetRole: 'CUSTOMER' }, provToken);
    assert(switchModeRes.status === 200 && switchModeRes.body.user?.activeRole === 'CUSTOMER', 'Multi-role user successfully switched active mode to CUSTOMER');

    // 31. Multi-role security: user cannot switch to ADMIN via mode switch
    const illegalAdminSwitch = await makeReq('POST', '/api/auth/switch-mode', { targetRole: 'ADMIN' }, provToken);
    assert(illegalAdminSwitch.status === 400 || illegalAdminSwitch.status === 403, 'Unauthorized switch to ADMIN correctly rejected');

    // 32. Server-side logout endpoint
    const logoutRes = await makeReq('POST', '/api/auth/logout', null, custToken);
    assert(logoutRes.status === 200, 'POST /api/auth/logout executed successfully');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n=== TEST RESULTS SUMMARY ===`);
  console.log(`Total tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
