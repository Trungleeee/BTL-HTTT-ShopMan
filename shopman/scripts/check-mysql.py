"""Read-only HTTP checks against the running Tomcat/MySQL application."""
import http.cookiejar
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request

BASE = os.environ.get('SHOPMAN_TEST_BASE', 'http://127.0.0.1:8080/shopman').rstrip('/')
ORIGIN = urllib.parse.urlsplit(BASE)
ORIGIN = ORIGIN.scheme + '://' + ORIGIN.netloc
cookies = http.cookiejar.CookieJar()
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies))


def request(path, values=None, origin=ORIGIN):
    data = None if values is None else urllib.parse.urlencode(values).encode()
    req = urllib.request.Request(BASE + path, data=data, headers={'Origin': origin})
    try:
        with client.open(req, timeout=30) as result:
            return result.status, result.read().decode('utf-8'), result.url
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode('utf-8'), error.url


def context(path, values=None):
    status, html, _ = request(path, values)
    assert status == 200, (path, status)
    assert 'assets/mock-data.js' not in html
    match = re.search(r'id="shopman-context">(.*?)</script>', html, re.S)
    assert match, 'Missing server context: ' + path
    return json.loads(match.group(1))


def login(username, expected_role, **extra_fields):
    status, body, _ = request('/api/session', dict(action='login', username=username, password='demo123', **extra_fields))
    assert status == 200, (username, status)
    assert json.loads(body)['user']['role'] == expected_role
    assert any(cookie.name == 'JSESSIONID' for cookie in cookies)


assert request('/quan-ly')[2].endswith('/dang-nhap'), 'Manager page must require login'
assert request('/api/session')[0] == 405
status, login_html, _ = request('/dang-nhap')
assert status == 200 and 'name="role"' not in login_html
assert not list(cookies), 'Anonymous requests must not create a session'
for username, password in (
    ('khachhang', 'Demo123'),
    ('shopman-nonexistent-test-user', 'demo123'),
):
    assert request('/api/session', dict(action='login', username=username, password=password))[0] == 401
    assert not list(cookies), 'Rejected login must not create a session'
login('khachhang', 'customer')
login('khachhang', 'customer', role='manager')
customer_session = next(cookie.value for cookie in cookies if cookie.name == 'JSESSIONID')
assert context('/cua-hang')['user']['role'] == 'customer'
assert request('/quan-ly')[2].endswith('/dang-nhap'), 'Customer must not access manager data'
assert request('/san-pham/chi-tiet', {'productId': 1}, 'https://example.invalid')[0] == 403
assert request('/san-pham/chi-tiet', {'productId': '-1'})[0] == 400
all_products = context('/san-pham')['data']['products']
assert context('/san-pham?tuKhoa=')['data']['products'] == all_products
assert context('/san-pham?tuKhoa=+++')['data']['products'] == all_products
assert context('/san-pham?tuKhoa=%25')['data']['products'] == [], 'LIKE wildcard must be literal'
search = context('/san-pham?tuKhoa=Lenovo')['data']
assert 'error' not in search, search.get('error')
products = search['products']
assert {product['id'] for product in products} <= {product['id'] for product in all_products}
for product in products:
    assert isinstance(product['sellingPrice'], (int, float))
    assert product['imageUrl'].startswith(('https://', 'assets/'))
    selected = context('/san-pham/chi-tiet', dict(productId=product['id'], tuKhoa='Lenovo'))['data']['product']
    assert selected == product
assert context('/san-pham/chi-tiet', {'productId': 99999999})['data']['product'] is None

login('Admin', 'manager')
assert next(cookie.value for cookie in cookies if cookie.name == 'JSESSIONID') != customer_session
manager_page = context('/quan-ly')
assert manager_page['user']['role'] == 'manager'
overview = manager_page['data']['overview']
assert sum(row['revenue'] for row in overview['monthlyRevenue']) == overview['totalRevenue']
assert overview['shippingOrders'] + overview['cancelledOrders'] <= overview['totalOrders']
report_path = '/quan-ly/bao-cao/doanh-thu-khach-hang'
assert context(report_path)['data'] == {}, 'Opening the filter must not load a report'
assert 'error' in context(report_path + '?ngayBatDau=2026-09-01')['data']
assert 'error' in context(report_path + '?ngayBatDau=2026-09-31&ngayKetThuc=2026-09-30')['data']
assert 'error' in context(report_path + '?ngayBatDau=2026-10-01&ngayKetThuc=2026-09-01')['data']
assert request('/quan-ly/khach-hang/lich-su-mua-hang', {'customerId': 1})[0] == 400
assert 'error' in context('/quan-ly/khach-hang/lich-su-mua-hang')['data']
assert 'error' in context('/quan-ly/hoa-don/chi-tiet')['data']
period = dict(ngayBatDau='2026-09-01', ngayKetThuc='2026-09-30')
report = context(report_path + '?' + urllib.parse.urlencode(period))['data']
assert 'error' not in report, report.get('error')
invoice_count = 0
for customer in report['customers']:
    history = context('/quan-ly/khach-hang/lich-su-mua-hang', dict(customerId=customer['id'], **period))['data']
    assert 'error' not in history, history.get('error')
    assert sum(order['totalAmount'] for order in history['orders']) == customer['tongDoanhThu']
    assert len(history['orders']) == customer['soHoaDon']
    for order in history['orders']:
        invoice = context('/quan-ly/hoa-don/chi-tiet', dict(orderId=order['id'], customerId=customer['id'], **period))['data']
        assert 'error' not in invoice, invoice.get('error')
        assert invoice['order'] == order, 'Invoice header must match the order saved by purchase history'
        assert sum(detail['quantity'] * detail['unitPrice'] for detail in invoice['details']) == order['totalAmount']
        assert invoice['order']['customer']['id'] == customer['id']
        invoice_count += 1
    invalid = context('/quan-ly/hoa-don/chi-tiet', dict(orderId=99999999, customerId=customer['id'], **period))['data']
    assert 'error' in invalid and 'details' not in invalid
    if history['orders']:
        selected_id = history['orders'][0]['id']
        assert request('/quan-ly/hoa-don/chi-tiet', dict(orderId=selected_id, customerId=99999999, **period))[0] == 400
        assert request('/quan-ly/hoa-don/chi-tiet', dict(orderId=selected_id, customerId=customer['id'],
                       ngayBatDau='2026-09-02', ngayKetThuc=period['ngayKetThuc']))[0] == 400

assert context(report_path)['data'] == {}, 'Returning to the filter without dates must start a new report'
assert request('/api/session', dict(action='logout'))[0] == 200
assert request('/quan-ly')[2].endswith('/dang-nhap'), 'Logout must end the session'

print('PASS: Tomcat/MySQL, authentication, product search/detail, JSON numbers, dashboard, periods and selection validation.')
print('Products matched: %d; customers in September: %d; invoices checked: %d.' % (len(products), len(report['customers']), invoice_count))
if not invoice_count:
    print('SKIP: populated purchase history/invoice checks; no delivered orders in September 2026.')
