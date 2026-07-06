import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { TransactionData } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReportProps {
  data: TransactionData;
  slipNo: string;
}

/**
 * Hidden off-screen component that renders the weigh slip report.
 * Call captureAndShare() via the ref to capture as image and share.
 */
const ReportView = React.forwardRef<ViewShot, ReportProps>(({ data, slipNo }, ref) => {
  const reportType = data.type === 'arrival' ? 'ARRIVAL' : 'DISPATCH';
  const dateStr = data.date || new Date().toISOString().split('T')[0];
  const now = new Date();
  const timeStr = now.toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });

  return (
    <ViewShot ref={ref} options={{ format: 'png', quality: 1, result: 'tmpfile' }}>
      <View style={rs.page} nativeID="report-view-container">
        {/* ── Header ── */}
        <View style={rs.headerRow}>
          <View style={rs.headerLeft}>
            <Text style={rs.companyName}>KELOTH HULLER</Text>
            <Text style={rs.companyDetail}>GST: 29ADFPH8046M1Z2 | Ph: 9744061516</Text>
            <Text style={rs.companyDetail}>Billing Address: Mutharmudi Village, Murnad Post,</Text>
            <Text style={rs.companyDetail}>Madikeri Taluk, Kodagu,</Text>
            <Text style={rs.companyDetail}>Karnataka – 571252</Text>
          </View>
          <View style={rs.headerRight}>
            <Text style={rs.reportType}>{reportType} WEIGH SLIP</Text>
            <Text style={rs.slipInfo}>Slip No: #{slipNo}</Text>
            <Text style={rs.slipInfo}>Date: {dateStr}</Text>
          </View>
        </View>

        <View style={rs.divider} />

        {/* ── Info Block ── */}
        <View style={rs.infoBlock}>
          <View style={rs.infoRow}>
            <Text style={rs.infoLabel}>SUPPLIER PARTY:</Text>
            <Text style={rs.infoValue}>{data.party_name}</Text>
          </View>
          <View style={rs.infoRow}>
            <Text style={rs.infoLabel}>VEHICLE NUMBER:</Text>
            <Text style={rs.infoValue}>{data.vehicle_number}</Text>
          </View>
          <View style={rs.infoRow}>
            <Text style={rs.infoLabel}>WEIGHMENT SLIP:</Text>
            <Text style={rs.infoValue}>{data.weighment_slip_number}</Text>
          </View>
          <View style={rs.infoRow}>
            <Text style={rs.infoLabel}>WEIGHER:</Text>
            <Text style={rs.infoValue}>{data.weigher}</Text>
          </View>
          <View style={rs.infoRow}>
            <Text style={rs.infoLabel}>COFFEE ITEM:</Text>
            <Text style={rs.infoValue}>{data.product_name}</Text>
          </View>
        </View>

        <View style={rs.divider} />

        {/* ── Data Table ── */}
        <View style={rs.table}>
          {/* Header Row */}
          <View style={rs.tableRow}>
            <View style={[rs.tableCell, rs.tableCellHeader]}><Text style={rs.tableHeaderText}>Gross Wt{'\n'}(kg)</Text></View>
            <View style={[rs.tableCell, rs.tableCellHeader]}><Text style={rs.tableHeaderText}>Bags</Text></View>
            <View style={[rs.tableCell, rs.tableCellHeader]}><Text style={rs.tableHeaderText}>Bag Tare{'\n'}(kg)</Text></View>
            <View style={[rs.tableCell, rs.tableCellHeader]}><Text style={rs.tableHeaderText}>Total Net{'\n'}Wt (kg)</Text></View>
            <View style={[rs.tableCell, rs.tableCellHeader]}><Text style={rs.tableHeaderText}>Deduction{'\n'}(kg)</Text></View>
            <View style={[rs.tableCell, rs.tableCellHeader]}><Text style={rs.tableHeaderText}>Net Wt{'\n'}(kg)</Text></View>
            <View style={[rs.tableCell, rs.tableCellHeader]}><Text style={rs.tableHeaderText}>Outturn</Text></View>
            <View style={[rs.tableCell, rs.tableCellHeader]}><Text style={rs.tableHeaderText}>Moisture</Text></View>
            <View style={[rs.tableCell, rs.tableCellHeader, rs.tableCellLast]}><Text style={rs.tableHeaderText}>End{'\n'}Product{'\n'}(EP)</Text></View>
          </View>

          {/* Data Row */}
          <View style={rs.tableRow}>
            <View style={[rs.tableCell, rs.tableCellData]}><Text style={rs.tableDataText}>{data.gross_weight.toFixed(2)}</Text></View>
            <View style={[rs.tableCell, rs.tableCellData]}><Text style={rs.tableDataText}>{data.bags}</Text></View>
            <View style={[rs.tableCell, rs.tableCellData]}><Text style={rs.tableDataText}>{data.bag_weight.toFixed(2)}</Text></View>
            <View style={[rs.tableCell, rs.tableCellData]}><Text style={rs.tableDataText}>{data.total_weight.toFixed(2)}</Text></View>
            <View style={[rs.tableCell, rs.tableCellData]}><Text style={rs.tableDataText}>{data.deduction.toFixed(2)}</Text></View>
            <View style={[rs.tableCell, rs.tableCellData]}><Text style={rs.tableDataText}>{data.net_weight.toFixed(2)}</Text></View>
            <View style={[rs.tableCell, rs.tableCellData]}><Text style={rs.tableDataText}>{data.outturn}%</Text></View>
            <View style={[rs.tableCell, rs.tableCellData]}><Text style={rs.tableDataText}>{data.moisture}%</Text></View>
            <View style={[rs.tableCell, rs.tableCellData, rs.tableCellLast]}><Text style={rs.tableDataTextBold}>{data.end_product.toFixed(2)}{'\n'}kg</Text></View>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={rs.footerMain}>
          <Text style={rs.footerSoftware}>DailyBook Coffee Software Page 1 of 1</Text>
        </View>

        <View style={rs.thankYouRow}>
          <Text style={rs.thankYouText}>Thank you for your business. We appreciate your partnership!</Text>
        </View>

        <View style={rs.signatureRow}>
          <View style={rs.signatureBlock}>
            <View style={rs.signatureLine} />
            <Text style={rs.signatureLabel}>Prepared By{'\n'}Weigher Signature</Text>
          </View>
          <View style={rs.signatureBlock}>
            <View style={rs.signatureLine} />
            <Text style={rs.signatureLabel}>Authorized Sign{'\n'}Receiver Sign</Text>
          </View>
        </View>

        <Text style={rs.auditText}>System Audit Verified. Modified at: {timeStr}</Text>
      </View>
    </ViewShot>
  );
});

ReportView.displayName = 'ReportView';

/**
 * Capture the report view as a PNG image and share it.
 */
export const captureAndShareReport = async (viewShotRef: React.RefObject<ViewShot | null>): Promise<void> => {
  if (Platform.OS === 'web') {
    // On web, use html-to-image to capture the DOM element directly!
    const element = document.getElementById('report-view-container');
    if (!element) {
      throw new Error('Report view container element was not found in the DOM');
    }

    const htmlToImage = require('html-to-image');
    const dataUrl = await htmlToImage.toPng(element, { backgroundColor: '#FFFFFF' });

    const link = document.createElement('a');
    link.download = `weigh_slip_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    return;
  }

  if (!viewShotRef.current) {
    throw new Error('Report view ref is not available');
  }

  const uri = await (viewShotRef.current as any).capture();

  // Copy to a shareable path with a descriptive name
  const fileName = `weigh_slip_${Date.now()}.png`;
  const destUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.copyAsync({ from: uri, to: destUri });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing isn't available on this device");
  }

  await Sharing.shareAsync(destUri, {
    mimeType: 'image/png',
    dialogTitle: 'Share Weigh Slip Report',
    UTI: 'public.png',
  });
};

const rs = StyleSheet.create({
  page: {
    width: SCREEN_WIDTH - 20,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderWidth: 1,
    borderColor: '#333',
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a1a1a',
    letterSpacing: 1,
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    color: '#333',
    lineHeight: 14,
  },
  reportType: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1a1a1a',
    textAlign: 'right',
    marginBottom: 4,
  },
  slipInfo: {
    fontSize: 10,
    color: '#333',
    textAlign: 'right',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#1a1a1a',
    marginVertical: 8,
  },
  // Info block
  infoBlock: {
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a1a1a',
    width: 130,
  },
  infoValue: {
    fontSize: 10,
    color: '#1a1a1a',
    flex: 1,
  },
  // Table
  table: {
    borderWidth: 1.5,
    borderColor: '#1a1a1a',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#1a1a1a',
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCellLast: {
    borderRightWidth: 0,
  },
  tableCellHeader: {
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1.5,
    borderBottomColor: '#1a1a1a',
    paddingVertical: 6,
  },
  tableCellData: {
    paddingVertical: 8,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  tableDataText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  tableDataTextBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  // Footer
  footerMain: {
    marginBottom: 6,
  },
  footerSoftware: {
    fontSize: 8,
    color: '#777',
    fontStyle: 'italic',
  },
  thankYouRow: {
    marginBottom: 16,
  },
  thankYouText: {
    fontSize: 9,
    color: '#333',
    fontStyle: 'italic',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  signatureBlock: {
    alignItems: 'center',
    width: '40%',
  },
  signatureLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#333',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#555',
    textAlign: 'center',
  },
  auditText: {
    fontSize: 7,
    color: '#999',
    textAlign: 'right',
    fontStyle: 'italic',
  },
});

export default ReportView;
